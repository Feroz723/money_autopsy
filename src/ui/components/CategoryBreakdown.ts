import type { CategorySummary } from "../../analysis/types.js";
import { formatIndianMoney, formatPercent, escapeHtml } from "../formatters.js";

export function renderCategoryBreakdown(categories: CategorySummary[]): string {
  if (categories.length === 0) {
    return `
      <section class="breakdown-card" aria-labelledby="cat-heading">
        <h3 id="cat-heading" class="card-title">Category Outflows</h3>
        <p class="empty-text">No spending categories recorded.</p>
      </section>
    `;
  }

  return `
    <section class="breakdown-card" aria-labelledby="cat-heading">
      <div class="card-title-row">
        <h3 id="cat-heading" class="card-title">Category Outflows</h3>
        <span class="card-meta">${categories.length} categories</span>
      </div>

      <div class="ranked-list" role="list">
        ${categories
          .map((cat) => {
            const pct = cat.percentOfTotal ?? 0;
            return `
              <div class="ranked-item" role="listitem">
                <div class="item-header">
                  <span class="item-name font-medium">${escapeHtml(cat.category)}</span>
                  <div class="item-stats">
                    <span class="item-amount font-numeric">${formatIndianMoney(cat.totalSpending)}</span>
                    <span class="item-pct font-numeric text-muted">(${formatPercent(pct)})</span>
                  </div>
                </div>
                <div class="progress-track" aria-hidden="true">
                  <div class="progress-fill" style="width: ${Math.min(100, Math.max(2, pct))}%;"></div>
                </div>
                <div class="item-sub">
                  <span>${cat.transactionCount} transaction${cat.transactionCount === 1 ? "" : "s"}</span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}
