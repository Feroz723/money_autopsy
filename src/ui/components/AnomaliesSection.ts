import type { AnomalyFlag } from "../../analysis/types.js";
import { formatDisplayDate, formatIndianMoney, cleanDisplayDescription, escapeHtml } from "../formatters.js";

export function renderAnomaliesSection(
  anomalies: AnomalyFlag[],
  showAll = false,
  selectedAnomalyIndex?: number | null
): string {
  if (anomalies.length === 0) {
    return "";
  }

  const visibleAnomalies = showAll ? anomalies : anomalies.slice(0, 3);
  const hiddenCount = anomalies.length - visibleAnomalies.length;

  return `
    <section class="analysis-feature-card" aria-labelledby="anomalies-heading">
      <div class="card-title-row">
        <div>
          <h3 id="anomalies-heading" class="card-title">Transactions Worth a Second Look</h3>
          <p class="card-subtitle">These transactions differ noticeably from your usual spending pattern.</p>
        </div>
        <span class="badge badge-warning">${anomalies.length} Flagged</span>
      </div>

      <div class="anomalies-list" role="list">
        ${visibleAnomalies
          .map((a) => {
            const amount = a.transaction.debit ?? a.transaction.credit ?? 0n;
            const isDebit = a.transaction.debit !== null;
            const title = cleanDisplayDescription(a.transaction.description);
            const isExpanded = selectedAnomalyIndex === a.transactionIndex;

            // Plain-English consumer summary
            const consumerSummary =
              a.severity === "high"
                ? "Much larger than your typical transaction."
                : "Noticeably different from your usual transaction amount.";

            return `
              <div class="anomaly-item ${isExpanded ? "is-expanded" : ""}" role="listitem">
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
                <div class="anomaly-consumer-summary text-secondary">${consumerSummary}</div>

                <div class="anomaly-action-row">
                  <button 
                    type="button" 
                    class="btn-toggle-anomaly-detail" 
                    data-anomaly-index="${a.transactionIndex}"
                    aria-expanded="${isExpanded}"
                  >
                    <span>${isExpanded ? "Hide details" : "See why &amp; evidence"}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform: rotate(${isExpanded ? "180deg" : "0deg"}); transition: transform 0.2s ease;">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>

                ${
                  isExpanded
                    ? `
                      <div class="anomaly-evidence-drawer">
                        <div class="evidence-grid">
                          <div class="evidence-item">
                            <span class="evidence-label">Baseline Median</span>
                            <span class="evidence-value font-numeric">${formatIndianMoney(a.baseline)}</span>
                          </div>
                          <div class="evidence-item">
                            <span class="evidence-label">Deviation Analysis</span>
                            <span class="evidence-value">${escapeHtml(a.reason)}</span>
                          </div>
                        </div>
                        ${
                          a.transaction.description
                            ? `<div class="evidence-raw-desc text-muted">Original: <code>${escapeHtml(a.transaction.description)}</code></div>`
                            : ""
                        }
                      </div>
                    `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>

      ${
        anomalies.length > 3
          ? `
            <div class="disclosure-footer">
              <button 
                type="button" 
                id="btn-toggle-all-anomalies" 
                class="btn-text-disclosure" 
                aria-expanded="${showAll}"
              >
                <span>${showAll ? "Show top 3 flagged transactions" : `Show all ${anomalies.length} flagged transactions (${hiddenCount} more)`}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform: rotate(${showAll ? "180deg" : "0deg"}); transition: transform 0.2s ease;">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
          `
          : ""
      }
    </section>
  `;
}
