import type { Finding } from "../../autopsy/types.js";
import type { AnalysisResult } from "../../analysis/types.js";
import { renderFindingCard } from "./FindingCard.js";

export function renderFindingsList(
  findings: Finding[],
  selectedFindingId?: string | null,
  analysis?: AnalysisResult,
  showAllFindings = false
): string {
  const isLowData = analysis ? analysis.periods.size <= 1 : false;

  if (findings.length === 0) {
    return `
      <section class="autopsy-section" aria-labelledby="autopsy-heading">
        <div class="section-header">
          <div>
            <h2 id="autopsy-heading" class="section-title">Money Autopsy</h2>
            <p class="section-subtitle">Plain-English evaluation of your statement data.</p>
          </div>
          <span class="findings-count-badge badge-neutral">0 Anomalies Detected</span>
        </div>

        <div class="empty-state-card" role="region" aria-label="Zero findings notice">
          <div class="empty-state-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="empty-state-content">
            <h3 class="empty-title">Nothing unusual stood out in this statement.</h3>
            <p class="empty-message">
              Your statement didn't contain enough material changes or unusual patterns to flag. Your verified cash flow totals, category breakdown, and ledger are available below.
            </p>
            ${
              isLowData
                ? `<p class="low-data-note text-muted">Note: Some patterns need more transaction history. Recurring payment detection and trends become more reliable with multi-month statements.</p>`
                : ""
            }
          </div>
        </div>
      </section>
    `;
  }

  // Dominant top finding card + secondary findings
  const dominantFinding = findings[0];
  const secondaryFindings = findings.slice(1);

  // Groupings for "What Stood Out"
  const spendingChangesCount = findings.filter(
    (f) => f.type === "SPENDING_INCREASE" || f.type === "SPENDING_DECREASE"
  ).length;
  const recurringCount = findings.filter(
    (f) => f.type === "RECURRING_PAYMENT" || f.type === "RECURRING_SPENDING_TOTAL"
  ).length;
  const anomaliesCount = findings.filter((f) => f.type === "UNUSUAL_TRANSACTION").length;
  const patternsCount = findings.filter(
    (f) =>
      f.type === "SPENDING_CONCENTRATION" ||
      f.type === "TOP_SPENDING_CATEGORY" ||
      f.type === "TOP_MERCHANT"
  ).length;

  const visibleSecondary = showAllFindings ? secondaryFindings : secondaryFindings.slice(0, 3);
  const hiddenCount = secondaryFindings.length - visibleSecondary.length;

  return `
    <section class="autopsy-section" aria-labelledby="autopsy-heading">
      <div class="section-header">
          <div>
            <h2 id="autopsy-heading" class="section-title">What We Found</h2>
            <p class="section-subtitle">Evidence-backed patterns from your statement.</p>
          </div>
        <span class="findings-count-badge">${findings.length} Evidence-Backed Finding${findings.length === 1 ? "" : "s"}</span>
      </div>

      ${
        isLowData
          ? `
            <div class="low-data-banner" role="note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Some patterns need more transaction history: Trend comparisons and recurring pattern confidence improve with multi-month statements.</span>
            </div>
          `
          : ""
      }

      <div class="dominant-finding-container">
        ${dominantFinding ? renderFindingCard(dominantFinding, selectedFindingId === dominantFinding.id, true) : ""}
      </div>

      ${
        secondaryFindings.length > 0
          ? `
            <div class="what-stood-out-section">
              <div class="stood-out-header">
                <h3 class="stood-out-title">What Stood Out</h3>
                <div class="stood-out-tags">
                  ${spendingChangesCount > 0 ? `<span class="tag-summary">${spendingChangesCount} spending change${spendingChangesCount === 1 ? "" : "s"}</span>` : ""}
                  ${recurringCount > 0 ? `<span class="tag-summary">${recurringCount} recurring detected</span>` : ""}
                  ${anomaliesCount > 0 ? `<span class="tag-summary">${anomaliesCount} unusual transaction${anomaliesCount === 1 ? "" : "s"}</span>` : ""}
                  ${patternsCount > 0 ? `<span class="tag-summary">${patternsCount} spending observation${patternsCount === 1 ? "" : "s"}</span>` : ""}
                </div>
              </div>

              <div class="findings-grid">
                ${visibleSecondary.map((f) => renderFindingCard(f, selectedFindingId === f.id, false)).join("")}
              </div>

              ${
                secondaryFindings.length > 3
                  ? `
                    <div class="findings-disclosure-row">
                      <button 
                        type="button" 
                        id="btn-toggle-all-findings" 
                        class="btn btn-secondary btn-disclosure" 
                        aria-expanded="${showAllFindings}"
                      >
                        <span>${showAllFindings ? "Show fewer findings" : `Show all ${findings.length} findings (${hiddenCount} more)`}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform: rotate(${showAllFindings ? "180deg" : "0deg"}); transition: transform 0.2s ease;">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                  `
                  : ""
              }
            </div>
          `
          : ""
      }
    </section>
  `;
}

