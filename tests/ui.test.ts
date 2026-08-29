// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from "vitest";
import { MoneyAutopsyApp } from "../src/ui/app.js";
import { genericCsv, balanceFailureCsv, xlsxEquivalentBytes } from "./fixtures/statements.js";
import { filterTransactions } from "../src/ui/components/TransactionTable.js";
import { analysisTransactions } from "./fixtures/analysis.js";

import { genericPdfBytes } from "./fixtures/pdf-statements.js";

// Mock File implementation for Node/Vitest test environment
function createMockFile(name: string, content: string | ArrayBuffer, type = "text/csv"): File {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer as ArrayBuffer,
  } as unknown as File;
}

describe("MoneyAutopsyApp UI Orchestrator", () => {
  let container: HTMLElement;
  let app: MoneyAutopsyApp;

  beforeEach(() => {
    container = document.createElement("div");
    app = new MoneyAutopsyApp(container);
  });

  it("starts in idle stage rendering the upload area and demo preview", () => {
    expect(app.getState().stage).toBe("idle");
    expect(container.querySelector("#drop-zone")).not.toBeNull();
    expect(container.textContent).toContain("Find out where your money actually went");
    expect(container.textContent).toContain("Processed on this device");
    expect(container.textContent).toContain("Nothing is uploaded or stored by this app");
    expect(container.textContent).toContain("Scanned/image-only PDFs aren't supported yet");
    expect(container.querySelector(".landing-preview-section")).not.toBeNull();
    expect(container.textContent).toContain("What your Money Autopsy looks like");
  });

  it("processes a valid generic CSV and transitions to ready stage", async () => {
    const file = createMockFile("statement.csv", genericCsv);
    await app.processFile(file);

    const state = app.getState();
    expect(state.stage).toBe("ready");
    expect(state.importResult).toBeDefined();
    expect(state.analysisResult).toBeDefined();
    expect(state.autopsyResult).toBeDefined();

    expect(container.querySelector(".autopsy-section")).not.toBeNull();
    expect(container.querySelector(".summary-grid")).not.toBeNull();
    expect(container.querySelector(".trust-section")).not.toBeNull();
  });

  it("renders dominant finding first when findings exist in multi-period statement", async () => {
    // Generate CSV with analysisTransactions that produce findings
    const header = "Date,Description,Debit,Credit,Balance\n";
    const rows = analysisTransactions
      .map(
        (t) =>
          `${t.date},${t.description ?? ""},${t.debit ? (Number(t.debit) / 100).toFixed(2) : ""},${
            t.credit ? (Number(t.credit) / 100).toFixed(2) : ""
          },${t.balance ? (Number(t.balance) / 100).toFixed(2) : ""}`
      )
      .join("\n");
    const file = createMockFile("statement.csv", header + rows);
    await app.processFile(file);

    expect(app.getState().stage).toBe("ready");
    expect(app.getState().autopsyResult?.findings.length).toBeGreaterThan(0);
    expect(container.querySelector(".dominant-finding-container")).not.toBeNull();
    expect(container.querySelector(".is-dominant")).not.toBeNull();
  });

  it("processes a valid XLSX statement file", async () => {
    const file = createMockFile(
      "statement.xlsx",
      xlsxEquivalentBytes(),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    await app.processFile(file);

    const state = app.getState();
    expect(state.stage).toBe("ready");
    expect(state.importResult?.format).toBe("XLSX");
  });

  it("processes a valid text-based PDF statement file", async () => {
    const file = createMockFile("statement.pdf", genericPdfBytes(), "application/pdf");
    await app.processFile(file);

    const state = app.getState();
    expect(state.stage).toBe("ready");
    expect(state.importResult?.format).toBe("PDF");
    expect(state.importResult?.transactions).toHaveLength(3);
    expect(container.querySelector(".trust-section")).not.toBeNull();
  });

  it("rejects unsupported extensions", async () => {
    const file = createMockFile("statement.png", "{}", "image/png");
    await app.processFile(file);

    expect(app.getState().stage).toBe("idle");
    expect(app.getState().error).toContain("Unsupported file type");
  });

  it("rejects files exceeding the 20MB limit", async () => {
    const oversizedBytes = new Uint8Array(21 * 1024 * 1024); // 21 MB
    const file = createMockFile("large.csv", oversizedBytes.buffer);
    await app.processFile(file);

    expect(app.getState().stage).toBe("idle");
    expect(app.getState().error).toContain("exceeds the maximum limit");
  });

  it("displays prominent warning when statement reconciliation fails", async () => {
    const file = createMockFile("unreliable.csv", balanceFailureCsv);
    await app.processFile(file);

    expect(app.getState().stage).toBe("ready");
    expect(app.getState().importResult?.reliable).toBe(false);
    expect(container.textContent).toContain("Statement Needs Review");
  });

  it("handles malformed CSV gracefully without crashing", async () => {
    const malformed = 'Date,Description,Debit\n"unterminated quote,something,100';
    const file = createMockFile("malformed.csv", malformed);
    await app.processFile(file);

    expect(app.getState().stage).toBe("idle");
    expect(app.getState().error).toBeDefined();
    expect(container.querySelector(".alert-error")).not.toBeNull();
  });

  it("resets all in-memory state cleanly when reset() is triggered", async () => {
    const file = createMockFile("statement.csv", genericCsv);
    await app.processFile(file);
    expect(app.getState().stage).toBe("ready");

    app.reset();
    expect(app.getState().stage).toBe("idle");
    expect(app.getState().importResult).toBeUndefined();
    expect(app.getState().analysisResult).toBeUndefined();
    expect(app.getState().autopsyResult).toBeUndefined();
    expect(container.querySelector("#drop-zone")).not.toBeNull();
  });

  it("safely escapes user-controlled strings to prevent HTML injection", async () => {
    const maliciousCsv = `Date,Description,Debit,Credit,Balance
2026-04-01,"<script>alert('xss')</script>",100.00,,900.00`;
    const file = createMockFile("statement.csv", maliciousCsv);
    await app.processFile(file);

    expect(app.getState().stage).toBe("ready");
    // Ensure raw unescaped script tag is not present in DOM as active element
    expect(container.innerHTML).not.toContain("<script>alert('xss')</script>");
    expect(container.innerHTML).toContain("&lt;script&gt;alert('xss')&lt;/script&gt;");
  });

  it("renders clean report header and 4-metric money summary with Money In and Money Out", async () => {
    const file = createMockFile("statement.csv", genericCsv);
    await app.processFile(file);

    expect(container.querySelector(".report-header")).not.toBeNull();
    expect(container.textContent).toContain("Here's what happened to your money");
    expect(container.textContent).toContain("Money Out");
    expect(container.textContent).toContain("Money In");
    expect(container.textContent).toContain("Net Cash Flow");
    expect(container.textContent).toContain("Transactions");
    expect(container.textContent).toContain("That's the Picture");
  });

  it("collapses transaction ledger initially and expands on user request", async () => {
    const file = createMockFile("statement.csv", genericCsv);
    await app.processFile(file);

    // Default: collapsed
    expect(container.querySelector(".transactions-section.is-collapsed")).not.toBeNull();
    expect(container.querySelector("#tx-search-input")).toBeNull();

    // Click to expand
    const toggleBtn = container.querySelector<HTMLButtonElement>("#btn-toggle-all-transactions");
    expect(toggleBtn).not.toBeNull();
    toggleBtn?.click();

    // Expanded: toolbar & table visible
    expect(container.querySelector(".transactions-section.is-expanded")).not.toBeNull();
    expect(container.querySelector("#tx-search-input")).not.toBeNull();
  });
});

describe("Transaction Filtering Logic", () => {
  it("filters transactions by search query", () => {
    const filtered = filterTransactions(analysisTransactions, {
      query: "swiggy",
      category: "all",
      direction: "all",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((f) => f.transaction.description?.toLowerCase().includes("swiggy"))).toBe(true);
  });

  it("filters transactions by category", () => {
    const filtered = filterTransactions(analysisTransactions, {
      query: "",
      category: "Transport",
      direction: "all",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((f) => f.category === "Transport")).toBe(true);
  });

  it("filters transactions by cash flow direction", () => {
    const debits = filterTransactions(analysisTransactions, {
      query: "",
      category: "all",
      direction: "debit",
    });
    expect(debits.every((f) => f.transaction.debit !== null)).toBe(true);

    const credits = filterTransactions(analysisTransactions, {
      query: "",
      category: "all",
      direction: "credit",
    });
    expect(credits.every((f) => f.transaction.credit !== null)).toBe(true);
  });
});
