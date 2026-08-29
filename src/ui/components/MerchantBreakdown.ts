import type { MerchantSummary } from "../../analysis/types.js";
import { formatIndianMoney, escapeHtml } from "../formatters.js";

function getMerchantInitials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2 && words[0] && words[1]) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  return (clean.slice(0, 2) || "M").toUpperCase();
}

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
        <div>
          <h3 id="merchant-heading" class="card-title">Top Spending Merchants</h3>
          <p class="card-subtitle">Payees with highest total volume</p>
        </div>
        <span class="card-meta-pill">Ranked by Volume</span>
      </div>

      <div class="merchant-table-wrapper">
        <table class="simple-table" aria-label="Top spending merchants list">
          <thead>
            <tr>
              <th scope="col">Merchant / Payee</th>
              <th scope="col" class="text-right">Total Outflow</th>
              <th scope="col" class="text-right">Txns</th>
              <th scope="col" class="text-right">Avg / Txn</th>
            </tr>
          </thead>
          <tbody>
            ${topMerchants
              .map(
                (m) => `
                  <tr>
                    <td class="merchant-cell">
                      <div class="merchant-info-group">
                        <span class="merchant-avatar font-mono">${escapeHtml(getMerchantInitials(m.merchant))}</span>
                        <span class="font-medium merchant-name-text">${escapeHtml(m.merchant)}</span>
                      </div>
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
