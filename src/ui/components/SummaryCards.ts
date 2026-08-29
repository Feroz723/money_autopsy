import type { CashFlowTotals } from "../../analysis/types.js";
import { formatIndianMoney } from "../formatters.js";

export function renderSummaryCards(totals: CashFlowTotals): string {
  const isNetPositive = totals.net >= 0n;

  return `
    <section class="summary-section" aria-labelledby="summary-heading">
      <h2 id="summary-heading" class="visually-hidden">Cash Flow Summary</h2>

      <div class="summary-grid">
        <div class="summary-card card-spending">
          <div class="card-header">
            <span class="card-label">Total Outflow (Spending)</span>
            <span class="card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <span class="card-label">Total Inflow (Income)</span>
            <span class="card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
          </div>
          <div class="card-amount font-numeric ${isNetPositive ? "text-positive" : "text-negative"}">
            ${isNetPositive ? "+" : ""}${formatIndianMoney(totals.net)}
          </div>
          <div class="card-footer">${isNetPositive ? "Inflow exceeded spending" : "Spending exceeded inflow"}</div>
        </div>
      </div>
    </section>
  `;
}
