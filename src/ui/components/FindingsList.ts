import type { Finding } from "../../autopsy/types.js";
import type { AnalysisResult } from "../../analysis/types.js";
import { renderFindingCard } from "./FindingCard.js";

export function renderFindingsList(
  findings: Finding[],
  selectedFindingId?: string | null,
  analysis?: AnalysisResult
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
              No significant spending surges, recurring payment patterns, anomalies, or high merchant concentrations were detected in this dataset. Your basic verified cash flow totals and ledger are available below.
            </p>
            ${
              isLowData
                ? `<p class="low-data-note text-muted">Note: Recurring patterns and trend comparisons need more transaction history (multi-month statements) to detect changes over time.</p>`
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

  return `
    <section class="autopsy-section" aria-labelledby="autopsy-heading">
      <div class="section-header">
        <div>
          <h2 id="autopsy-heading" class="section-title">Money Autopsy</h2>
          <p class="section-subtitle">What happened to your money based on mathematical and pattern analysis.</p>
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
              <span>Single-period statement: Trend comparisons and recurring pattern confidence improve with multi-month statements.</span>
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
            <div class="secondary-findings-header">
              <h3 class="secondary-title">Additional Observations</h3>
            </div>
            <div class="findings-grid">
              ${secondaryFindings.map((f) => renderFindingCard(f, selectedFindingId === f.id, false)).join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

