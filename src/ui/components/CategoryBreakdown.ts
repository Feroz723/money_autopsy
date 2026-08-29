import type { CategorySummary } from "../../analysis/types.js";
import { formatIndianMoney, formatPercent, escapeHtml } from "../formatters.js";

const CATEGORY_GRADIENTS = [
  "linear-gradient(90deg, #f97316, #fb923c)",
  "linear-gradient(90deg, #0ea5e9, #38bdf8)",
  "linear-gradient(90deg, #a855f7, #c084fc)",
  "linear-gradient(90deg, #22c55e, #4ade80)",
  "linear-gradient(90deg, #ec4899, #f472b6)",
  "linear-gradient(90deg, #eab308, #facc15)",
  "linear-gradient(90deg, #14b8a6, #2dd4bf)",
  "linear-gradient(90deg, #6366f1, #818cf8)",
];

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
        <div>
          <h3 id="cat-heading" class="card-title">Category Outflows</h3>
          <p class="card-subtitle">Where your outflow concentrated</p>
        </div>
        <span class="card-meta-pill">${categories.length} Categories</span>
      </div>

      <div class="ranked-list" role="list">
        ${categories
          .map((cat, idx) => {
            const pct = cat.percentOfTotal ?? 0;
            const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]!;
            const avg = cat.transactionCount > 0 ? formatIndianMoney(cat.totalSpending / BigInt(cat.transactionCount)) : "₹0";
            return `
              <div class="ranked-item" role="listitem">
                <div class="item-header">
                  <div class="item-title-group">
                    <span class="category-indicator-dot" style="background: ${gradient};"></span>
                    <span class="item-name font-medium">${escapeHtml(cat.category)}</span>
                  </div>
                  <div class="item-stats">
                    <span class="item-amount font-numeric font-medium">${formatIndianMoney(cat.totalSpending)}</span>
                    <span class="item-pct font-numeric text-muted">(${formatPercent(pct)})</span>
                  </div>
                </div>
                <div class="progress-track" aria-hidden="true">
                  <div class="progress-fill" style="width: ${Math.min(100, Math.max(3, pct))}%; background: ${gradient};"></div>
                </div>
                <div class="item-sub">
                  <span>${cat.transactionCount} debit${cat.transactionCount === 1 ? "" : "s"}</span>
                  <span>${avg} avg</span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}
