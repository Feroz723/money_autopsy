import type { CashFlowTotals } from "../../analysis/types.js";
import type { ImportResult } from "../../ingestion/types.js";
import { formatIndianMoney, formatDateRange, escapeHtml } from "../formatters.js";

export function renderSummaryCards(totals: CashFlowTotals, importResult?: ImportResult): string {
  const isNetPositive = totals.net >= 0n;
  const totalTxCount = totals.spendingCount + totals.incomeCount;

  let metadataHtml = "";
  if (importResult) {
    const dateRange = formatDateRange(importResult.transactions);
    const sourceLabel =
      importResult.source === "hdfc-bank"
        ? "HDFC Bank statement"
        : importResult.source === "icici-bank-detailed"
        ? "ICICI Bank statement"
        : "Generic statement";
    const verificationLabel = importResult.reliable ? "✓ Balances verified" : "! Statement needs review";
    const verificationClass = importResult.reliable ? "badge-verified" : "badge-warning-status";

    metadataHtml = `
      <div class="report-header">
        <div class="report-title-group">
          <span class="report-badge">MONEY AUTOPSY REPORT</span>
          <h1 class="report-headline">Here's what happened to your money</h1>
        </div>
        <div class="report-meta-chips">
          <span class="meta-chip meta-date">${escapeHtml(dateRange)}</span>
          <span class="meta-chip meta-source">${escapeHtml(sourceLabel)}</span>
          <span class="meta-chip meta-count">${totalTxCount} transactions</span>
          <span class="meta-chip ${verificationClass}">${escapeHtml(verificationLabel)}</span>
        </div>
        ${
          !importResult.reliable
            ? `<div class="unreliable-alert-bar" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Some balance calculations did not reconcile with the statement, so parts of this report may be incomplete.</span>
              </div>`
            : ""
        }
      </div>
    `;
  }

  return `
    <section class="summary-section" aria-labelledby="summary-heading">
      <h2 id="summary-heading" class="visually-hidden">Primary Money Summary</h2>
      ${metadataHtml}

      <div class="summary-grid">
        <div class="summary-card card-spending">
          <div class="card-header">
            <span class="card-label">Money Out</span>
            <span class="card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="7" x2="17" y2="17"/>
                <polyline points="17 7 17 17 7 17"/>
              </svg>
            </span>
          </div>
          <div class="card-amount font-numeric text-negative">${formatIndianMoney(totals.spending)}</div>
          <div class="card-footer">${totals.spendingCount.toLocaleString("en-IN")} debits recorded</div>
        </div>

        <div class="summary-card card-income">
          <div class="card-header">
            <span class="card-label">Money In</span>
            <span class="card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </span>
          </div>
          <div class="card-amount font-numeric text-positive">${formatIndianMoney(totals.income)}</div>
          <div class="card-footer">${totals.incomeCount.toLocaleString("en-IN")} deposits recorded</div>
        </div>

        <div class="summary-card card-net ${isNetPositive ? "net-positive" : "net-negative"}">
          <div class="card-header">
            <span class="card-label">Net Cash Flow</span>
            <span class="card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
          </div>
          <div class="card-amount font-numeric ${isNetPositive ? "text-positive" : "text-negative"}">
            ${isNetPositive ? "+" : ""}${formatIndianMoney(totals.net)}
          </div>
          <div class="card-footer">${isNetPositive ? "Inflow exceeded spending" : "Spending exceeded inflow"}</div>
        </div>

        <div class="summary-card card-tx-count">
          <div class="card-header">
            <span class="card-label">Transactions</span>
            <span class="card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </span>
          </div>
          <div class="card-amount font-numeric text-primary">${totalTxCount.toLocaleString("en-IN")}</div>
          <div class="card-footer">${totals.spendingCount} debits &bull; ${totals.incomeCount} credits</div>
        </div>
      </div>
    </section>
  `;
}
