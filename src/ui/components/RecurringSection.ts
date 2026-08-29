import type { RecurringPayment } from "../../analysis/types.js";
import { formatDisplayDate, formatIndianMoney, escapeHtml } from "../formatters.js";

export function renderRecurringSection(recurringPayments: RecurringPayment[]): string {
  if (recurringPayments.length === 0) {
    return "";
  }

  return `
    <section class="analysis-feature-card" aria-labelledby="recurring-heading">
      <div class="card-title-row">
        <div>
          <h3 id="recurring-heading" class="card-title">Likely Recurring Payments</h3>
          <p class="card-subtitle">Repeated payments with consistent intervals and amounts (~7, 14, 30, 60, or 90 days).</p>
        </div>
        <span class="badge badge-info">${recurringPayments.length} Pattern${recurringPayments.length === 1 ? "" : "s"}</span>
      </div>

      <div class="recurring-grid">
        ${recurringPayments
          .map(
            (r) => `
              <div class="recurring-card">
                <div class="rec-header">
                  <span class="rec-merchant font-medium">${escapeHtml(r.merchant)}</span>
                  <span class="badge-subtle confidence-${escapeHtml(r.confidence)}">${escapeHtml(r.confidence)} confidence</span>
                </div>
                <div class="rec-amount font-numeric font-medium text-negative">
                  ~${formatIndianMoney(r.estimatedAmount)}
                </div>
                <div class="rec-details">
                  <span>Cycle: <strong>Every ~${r.detectedIntervalDays} days</strong></span>
                  <span>Occurrences: <strong>${r.occurrences} times</strong></span>
                </div>
                <div class="rec-dates">
                  <span class="rec-dates-label">Dates:</span>
                  <span class="rec-dates-list">${r.dates.map((d) => formatDisplayDate(d)).join(", ")}</span>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}
