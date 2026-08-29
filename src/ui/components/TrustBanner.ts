import type { ImportResult } from "../../ingestion/types.js";
import { getSourceDisplayName } from "../config.js";
import { formatDateRange, formatIndianMoney, escapeHtml } from "../formatters.js";

export function renderTrustBanner(importResult: ImportResult, findingsCount?: number): string {
  const { diagnostics, reliable, source, transactions, totals, format } = importResult;
  const { balanceVerification, rejectedRows, possibleDuplicates } = diagnostics;
  const isVerified = balanceVerification.status === "verified";
  const isUnreliable = !reliable || balanceVerification.status === "unreliable";

  const dateRangeStr = formatDateRange(transactions);
  const sourceName = getSourceDisplayName(source);

  return `
    <section class="trust-section" aria-labelledby="trust-heading">
      <h2 id="trust-heading" class="section-title">Statement Verification Details</h2>

      ${
        isUnreliable
          ? `
            <div class="alert alert-warning" role="alert">
              <div class="alert-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="alert-content">
                <h3 class="alert-title">Statement Needs Review</h3>
                <p class="alert-message">
                  ${escapeHtml(balanceVerification.message || "Some transaction balances do not reconcile mathematically.")}
                  Some findings above may be affected. Please cross-reference with your official bank records.
                </p>
              </div>
            </div>
          `
          : ""
      }

      <div class="trust-card">
        <div class="trust-header">
          <div class="profile-info">
            <span class="profile-tag format-${escapeHtml(format.toLowerCase())}">${escapeHtml(format)}</span>
            <span class="profile-name">${escapeHtml(sourceName)}</span>
          </div>

          <div class="trust-badge ${isVerified ? "trust-verified" : isUnreliable ? "trust-unreliable" : "trust-unavailable"}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              ${
                isVerified
                  ? `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`
                  : isUnreliable
                  ? `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
                  : `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`
              }
            </svg>
            <span>
              ${
                isVerified
                  ? `Balances verified (${balanceVerification.transitionsChecked} transitions)`
                  : isUnreliable
                  ? "Statement needs review"
                  : "Balance check unavailable"
              }
            </span>
          </div>
        </div>

        <div class="trust-grid">
          <div class="trust-metric">
            <span class="metric-label">Date Coverage</span>
            <span class="metric-value font-medium">${dateRangeStr}</span>
          </div>

          <div class="trust-metric">
            <span class="metric-label">Transactions Accepted</span>
            <span class="metric-value">${diagnostics.transactionsAccepted.toLocaleString("en-IN")}</span>
          </div>

          <div class="trust-metric">
            <span class="metric-label">Total Deposits (In)</span>
            <span class="metric-value text-positive font-numeric">${formatIndianMoney(totals.credit)}</span>
          </div>

          <div class="trust-metric">
            <span class="metric-label">Total Withdrawals (Out)</span>
            <span class="metric-value text-negative font-numeric">${formatIndianMoney(totals.debit)}</span>
          </div>

          ${
            rejectedRows.length > 0
              ? `
                <div class="trust-metric">
                  <span class="metric-label">Rejected Rows</span>
                  <span class="metric-value text-warning">${rejectedRows.length}</span>
                </div>
              `
              : ""
          }

          ${
            possibleDuplicates > 0
              ? `
                <div class="trust-metric">
                  <span class="metric-label">Possible Duplicate Rows</span>
                  <span class="metric-value text-muted">${possibleDuplicates}</span>
                </div>
              `
              : ""
          }
        </div>
      </div>

      <div class="report-closing-box">
        <h3 class="closing-title">That's the Picture</h3>
        <p class="closing-summary">
          <span>${transactions.length.toLocaleString("en-IN")} transactions analyzed</span>
          <span>&bull;</span>
          <span>${findingsCount !== undefined ? `${findingsCount} findings` : "Deterministic analysis complete"}</span>
          <span>&bull;</span>
          <span class="${isVerified ? "text-positive font-medium" : isUnreliable ? "text-warning font-medium" : "text-muted"}">
            ${isVerified ? "Balances verified" : isUnreliable ? "Statement needs review" : "Balance check unavailable"}
          </span>
        </p>
      </div>
    </section>
  `;
}
