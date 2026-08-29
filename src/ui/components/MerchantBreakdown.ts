import type { MerchantSummary } from "../../analysis/types.js";
import { formatIndianMoney, escapeHtml } from "../formatters.js";

export function renderMerchantBreakdown(topMerchants: MerchantSummary[]): string {
  if (topMerchants.length === 0) {
    return `
      <section class="breakdown-card" aria-labelledby="merchant-heading">
        <h3 id="merchant-heading" class="card-title">Top Spending Merchants</h3>
        <p class="empty-text">No merchant spending recorded.</p>
      </section>
    `;
  }

  return `
    <section class="breakdown-card" aria-labelledby="merchant-heading">
      <div class="card-title-row">
        <h3 id="merchant-heading" class="card-title">Top Spending Merchants</h3>
        <span class="card-meta">Ranked by total volume</span>
      </div>

      <div class="merchant-table-wrapper">
        <table class="simple-table" aria-label="Top spending merchants list">
          <thead>
            <tr>
              <th scope="col">Merchant</th>
              <th scope="col" class="text-right">Total Outflow</th>
              <th scope="col" class="text-right">Txns</th>
              <th scope="col" class="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            ${topMerchants
              .map(
                (m) => `
                  <tr>
                    <td class="merchant-cell">
                      <span class="font-medium">${escapeHtml(m.merchant)}</span>
                    </td>
                    <td class="text-right font-numeric font-medium">${formatIndianMoney(m.totalSpending)}</td>
                    <td class="text-right text-muted">${m.transactionCount}</td>
                    <td class="text-right font-numeric text-muted">${formatIndianMoney(m.averageAmount)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
