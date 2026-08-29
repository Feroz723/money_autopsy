import type { AnomalyFlag } from "../../analysis/types.js";
import { formatDisplayDate, formatIndianMoney, cleanDisplayDescription, escapeHtml } from "../formatters.js";

export function renderAnomaliesSection(anomalies: AnomalyFlag[]): string {
  if (anomalies.length === 0) {
    return "";
  }

  return `
    <section class="analysis-feature-card" aria-labelledby="anomalies-heading">
      <div class="card-title-row">
        <div>
          <h3 id="anomalies-heading" class="card-title">Transactions Worth a Second Look</h3>
          <p class="card-subtitle">Transactions whose amount significantly diverges from your historical median spending pattern.</p>
        </div>
        <span class="badge badge-warning">${anomalies.length} Flagged</span>
      </div>

      <div class="anomalies-list" role="list">
        ${anomalies
          .map((a) => {
            const amount = a.transaction.debit ?? a.transaction.credit ?? 0n;
            const isDebit = a.transaction.debit !== null;
            const title = cleanDisplayDescription(a.transaction.description);

            return `
              <div class="anomaly-item" role="listitem">
                <div class="anomaly-top-row">
                  <div class="anomaly-meta-left">
                    <span class="anomaly-date">${formatDisplayDate(a.transaction.date)}</span>
                    <span class="badge-subtle severity-${escapeHtml(a.severity)}">${escapeHtml(a.severity)} deviation</span>
                  </div>
                  <div class="anomaly-amount font-numeric font-medium ${isDebit ? "text-negative" : "text-positive"}">
                    ${isDebit ? "-" : "+"}${formatIndianMoney(amount)}
                  </div>
                </div>
                <div class="anomaly-desc font-medium">${escapeHtml(title)}</div>
                <div class="anomaly-reason text-muted">${escapeHtml(a.reason)} &bull; Median: ${formatIndianMoney(a.baseline)}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}
