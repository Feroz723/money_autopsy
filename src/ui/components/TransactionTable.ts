import type { NormalizedTransaction } from "../../ingestion/types.js";
import { classifyTransaction } from "../../analysis/categories.js";
import { formatDisplayDate, formatIndianMoney, escapeHtml } from "../formatters.js";

interface FilterOptions {
  query: string;
  category: string;
  direction: "all" | "debit" | "credit";
}

export function filterTransactions(
  transactions: NormalizedTransaction[],
  filter: FilterOptions
): { transaction: NormalizedTransaction; category: string; confidence: string }[] {
  const query = filter.query.trim().toLowerCase();

  return transactions
    .map((t) => {
      const { category, confidence } = classifyTransaction(t);
      return { transaction: t, category, confidence };
    })
    .filter(({ transaction: t, category }) => {
      if (filter.direction === "debit" && t.debit === null) return false;
      if (filter.direction === "credit" && t.credit === null) return false;
      if (filter.category !== "all" && category !== filter.category) return false;

      if (query !== "") {
        const desc = (t.description ?? "").toLowerCase();
        const ref = (t.reference ?? "").toLowerCase();
        const cat = category.toLowerCase();
        if (!desc.includes(query) && !ref.includes(query) && !cat.includes(query)) {
          return false;
        }
      }

      return true;
    });
}

export function renderTransactionTable(
  transactions: NormalizedTransaction[],
  filter: FilterOptions = { query: "", category: "all", direction: "all" }
): string {
  if (transactions.length === 0) {
    return `
      <section class="transactions-section" aria-labelledby="tx-heading">
        <h3 id="tx-heading" class="section-title">Transactions</h3>
        <p class="empty-text">No transactions recorded.</p>
      </section>
    `;
  }

  // Get distinct categories
  const categories = Array.from(new Set(transactions.map((t) => classifyTransaction(t).category))).sort();
  const filtered = filterTransactions(transactions, filter);

  return `
    <section class="transactions-section" aria-labelledby="tx-heading">
      <div class="section-header">
        <div>
          <h3 id="tx-heading" class="section-title">Explore Transactions</h3>
          <p class="section-subtitle">Normalized transaction ledger with deterministic category tagging.</p>
        </div>
        <span class="tx-count-label">Showing ${filtered.length} of ${transactions.length} transactions</span>
      </div>

      <div class="table-toolbar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="search" 
            id="tx-search-input" 
            class="input-search" 
            placeholder="Search description, reference, or category..." 
            value="${escapeHtml(filter.query)}" 
            aria-label="Search transactions"
          />
        </div>

        <div class="filter-group">
          <label for="tx-category-select" class="visually-hidden">Filter by Category</label>
          <select id="tx-category-select" class="select-filter" aria-label="Filter by category">
            <option value="all" ${filter.category === "all" ? "selected" : ""}>All Categories</option>
            ${categories
              .map((c) => `<option value="${escapeHtml(c)}" ${filter.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`)
              .join("")}
          </select>

          <label for="tx-direction-select" class="visually-hidden">Filter by Cash Direction</label>
          <select id="tx-direction-select" class="select-filter" aria-label="Filter by cash direction">
            <option value="all" ${filter.direction === "all" ? "selected" : ""}>All Flows</option>
            <option value="debit" ${filter.direction === "debit" ? "selected" : ""}>Withdrawals (Debit)</option>
            <option value="credit" ${filter.direction === "credit" ? "selected" : ""}>Deposits (Credit)</option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table" aria-label="Normalized statement transaction table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Description / Narration</th>
              <th scope="col">Category</th>
              <th scope="col" class="text-right">Withdrawal (Debit)</th>
              <th scope="col" class="text-right">Deposit (Credit)</th>
              <th scope="col" class="text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length === 0
                ? `
                  <tr>
                    <td colspan="6" class="text-center py-6 text-muted">
                      No transactions match the selected filter criteria.
                    </td>
                  </tr>
                `
                : filtered
                    .map(({ transaction: t, category, confidence }) => `
                      <tr>
                        <td class="cell-date font-medium">${formatDisplayDate(t.date)}</td>
                        <td class="cell-desc">
                          <div class="desc-text">${t.description ? escapeHtml(t.description) : '<span class="text-muted">No description</span>'}</div>
                          ${t.reference ? `<div class="desc-ref text-muted">Ref: ${escapeHtml(t.reference)}</div>` : ""}
                        </td>
                        <td class="cell-category">
                          <span class="category-tag category-${escapeHtml(category.toLowerCase().replace(/[^a-z0-9]/g, "-"))}">
                            ${escapeHtml(category)}
                          </span>
                          <span class="confidence-indicator dot-${escapeHtml(confidence)}" title="Classification confidence: ${escapeHtml(confidence)}"></span>
                        </td>
                        <td class="text-right font-numeric font-medium text-negative">
                          ${t.debit !== null ? formatIndianMoney(t.debit) : "—"}
                        </td>
                        <td class="text-right font-numeric font-medium text-positive">
                          ${t.credit !== null ? formatIndianMoney(t.credit) : "—"}
                        </td>
                        <td class="text-right font-numeric text-muted">
                          ${t.balance !== null ? formatIndianMoney(t.balance) : "—"}
                        </td>
                      </tr>
                    `)
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}
