import { ingestBrowserStatement } from "../ingestion/ingest.js";
import { analyzeTransactions } from "../analysis/index.js";
import { generateAutopsy } from "../autopsy/index.js";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, SUPPORTED_EXTENSIONS } from "./config.js";
import { createInitialState, type AppState } from "./state.js";
import { renderHeader } from "./components/Header.js";
import { renderUploadArea } from "./components/UploadArea.js";
import { renderProcessingView } from "./components/ProcessingView.js";
import { renderTrustBanner } from "./components/TrustBanner.js";
import { renderSummaryCards } from "./components/SummaryCards.js";
import { renderFindingsList } from "./components/FindingsList.js";
import { renderCategoryBreakdown } from "./components/CategoryBreakdown.js";
import { renderMerchantBreakdown } from "./components/MerchantBreakdown.js";
import { renderRecurringSection } from "./components/RecurringSection.js";
import { renderAnomaliesSection } from "./components/AnomaliesSection.js";
import { renderTransactionTable } from "./components/TransactionTable.js";

export class MoneyAutopsyApp {
  private state: AppState = createInitialState();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public getState(): Readonly<AppState> {
    return this.state;
  }

  public reset(): void {
    this.state = createInitialState();
    this.render();
  }

  public async processFile(file: File): Promise<void> {
    // 1. File size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.state.stage = "idle";
      this.state.error = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of ${MAX_FILE_SIZE_LABEL}.`;
      this.render();
      return;
    }

    // 2. File type check
    const lowerName = file.name.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!isSupported) {
      this.state.stage = "idle";
      this.state.error = "Unsupported file type. Please upload a .CSV, .XLSX, or text-based .PDF statement file.";
      this.render();
      return;
    }

    try {
      // Stage: Reading
      this.state.stage = "reading";
      this.state.stageMessage = "Reading statement file into memory...";
      this.state.error = undefined;
      this.state.file = { name: file.name, size: file.size };
      this.render();

      // Yield event loop to allow render update
      await new Promise((r) => setTimeout(r, 16));

      // Stage: Ingesting & Checking
      this.state.stage = "checking";
      this.state.stageMessage = "Extracting transaction headers and verifying running balances...";
      this.render();
      await new Promise((r) => setTimeout(r, 16));

      const importResult = await ingestBrowserStatement(file);
      this.state.importResult = importResult;

      // Stage: Analyzing
      this.state.stage = "analyzing";
      this.state.stageMessage = "Running cash flow autopsy and detecting spending patterns...";
      this.render();
      await new Promise((r) => setTimeout(r, 16));

      const analysisResult = analyzeTransactions(importResult.transactions);
      this.state.analysisResult = analysisResult;

      const autopsyResult = generateAutopsy(analysisResult);
      this.state.autopsyResult = autopsyResult;

      // Stage: Ready
      this.state.stage = "ready";
      this.state.stageMessage = "";
      this.render();
    } catch (err: unknown) {
      this.state.stage = "idle";
      const message = err instanceof Error ? err.message : "An unexpected error occurred while parsing the statement.";
      this.state.error = message;
      this.render();
    }
  }

  public render(): void {
    const { stage, stageMessage, error, importResult, analysisResult, autopsyResult, selectedFindingId, transactionFilter } =
      this.state;

    let mainContent = "";

    if (stage === "reading" || stage === "checking" || stage === "analyzing") {
      mainContent = renderProcessingView(stage, stageMessage);
    } else if (stage === "ready" && importResult && analysisResult && autopsyResult) {
      mainContent = `
        <div class="report-view">
          ${renderFindingsList(autopsyResult.findings, selectedFindingId, analysisResult)}
          ${renderSummaryCards(analysisResult.totals)}

          <div class="breakdown-grid">
            ${renderCategoryBreakdown(analysisResult.categories)}
            ${renderMerchantBreakdown(analysisResult.topMerchants)}
          </div>

          ${renderRecurringSection(analysisResult.recurringPayments)}
          ${renderAnomaliesSection(analysisResult.anomalies)}
          ${renderTransactionTable(importResult.transactions, transactionFilter)}
          ${renderTrustBanner(importResult)}
        </div>
      `;
    } else {
      mainContent = renderUploadArea(error);
    }

    this.container.innerHTML = `
      <div class="app-layout">
        ${renderHeader(this.state)}
        <main class="main-content">
          ${mainContent}
        </main>
        <footer class="app-footer">
          <p>Money Autopsy &bull; Local-only deterministic financial intelligence &bull; Zero data persistence</p>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Reset button
    const btnReset = this.container.querySelector<HTMLButtonElement>("#btn-reset");
    btnReset?.addEventListener("click", () => this.reset());

    // Upload dropzone and file input
    const dropZone = this.container.querySelector<HTMLElement>("#drop-zone");
    const fileInput = this.container.querySelector<HTMLInputElement>("#file-input");

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());
      dropZone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file) this.processFile(file);
        }
      });

      fileInput.addEventListener("change", () => {
        const files = fileInput.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file) this.processFile(file);
        }
      });
    }

    // Toggle evidence drill-down buttons
    const toggleBtns = this.container.querySelectorAll<HTMLButtonElement>(".btn-toggle-evidence");
    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute("data-target");
        this.state.selectedFindingId = this.state.selectedFindingId === targetId ? null : targetId;
        this.render();
      });
    });

    // Transaction search input
    const searchInput = this.container.querySelector<HTMLInputElement>("#tx-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const val = (e.target as HTMLInputElement).value;
        if (this.state.transactionFilter) {
          this.state.transactionFilter.query = val;
          this.updateTransactionTableOnly();
        }
      });
    }

    // Transaction category filter
    const catSelect = this.container.querySelector<HTMLSelectElement>("#tx-category-select");
    if (catSelect) {
      catSelect.addEventListener("change", (e) => {
        const val = (e.target as HTMLSelectElement).value;
        if (this.state.transactionFilter) {
          this.state.transactionFilter.category = val;
          this.updateTransactionTableOnly();
        }
      });
    }

    // Transaction direction filter
    const dirSelect = this.container.querySelector<HTMLSelectElement>("#tx-direction-select");
    if (dirSelect) {
      dirSelect.addEventListener("change", (e) => {
        const val = (e.target as HTMLSelectElement).value as "all" | "debit" | "credit";
        if (this.state.transactionFilter) {
          this.state.transactionFilter.direction = val;
          this.updateTransactionTableOnly();
        }
      });
    }
  }

  private updateTransactionTableOnly(): void {
    const txSection = this.container.querySelector<HTMLElement>(".transactions-section");
    if (txSection && this.state.importResult) {
      const parent = txSection.parentElement;
      if (parent) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = renderTransactionTable(
          this.state.importResult.transactions,
          this.state.transactionFilter
        );
        const newSection = tempDiv.firstElementChild;
        if (newSection) {
          parent.replaceChild(newSection, txSection);
          this.bindTransactionToolbarEvents();
        }
      }
    }
  }

  private bindTransactionToolbarEvents(): void {
    const searchInput = this.container.querySelector<HTMLInputElement>("#tx-search-input");
    if (searchInput) {
      // Focus retention cursor trick
      searchInput.focus();
      const len = searchInput.value.length;
      searchInput.setSelectionRange(len, len);

      searchInput.addEventListener("input", (e) => {
        const val = (e.target as HTMLInputElement).value;
        if (this.state.transactionFilter) {
          this.state.transactionFilter.query = val;
          this.updateTransactionTableOnly();
        }
      });
    }

    const catSelect = this.container.querySelector<HTMLSelectElement>("#tx-category-select");
    catSelect?.addEventListener("change", (e) => {
      const val = (e.target as HTMLSelectElement).value;
      if (this.state.transactionFilter) {
        this.state.transactionFilter.category = val;
        this.updateTransactionTableOnly();
      }
    });

    const dirSelect = this.container.querySelector<HTMLSelectElement>("#tx-direction-select");
    dirSelect?.addEventListener("change", (e) => {
      const val = (e.target as HTMLSelectElement).value as "all" | "debit" | "credit";
      if (this.state.transactionFilter) {
        this.state.transactionFilter.direction = val;
        this.updateTransactionTableOnly();
      }
    });
  }
}

// Auto-initialize when mounted in browser
if (typeof document !== "undefined") {
  const mountPoint = document.getElementById("app");
  if (mountPoint) {
    new MoneyAutopsyApp(mountPoint);
  }
}
