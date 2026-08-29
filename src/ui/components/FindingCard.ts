import type { Finding } from "../../autopsy/types.js";
import { formatDisplayDate, formatIndianMoney, formatPercent, escapeHtml } from "../formatters.js";

function renderEvidenceDetails(finding: Finding): string {
  const { type, evidence } = finding;

  switch (type) {
    case "SPENDING_INCREASE":
    case "SPENDING_DECREASE": {
      const e = evidence as {
        currentPeriod: string;
        previousPeriod: string;
        currentSpending: bigint;
        previousSpending: bigint;
        changeAmount: bigint;
        changePercent: number;
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">${escapeHtml(e.previousPeriod)} Spending</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.previousSpending)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">${escapeHtml(e.currentPeriod)} Spending</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.currentSpending)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Net Difference</span>
            <span class="evidence-value font-numeric ${e.changeAmount > 0n ? "text-negative" : "text-positive"}">
              ${e.changeAmount > 0n ? "+" : ""}${formatIndianMoney(e.changeAmount)}
            </span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Percentage Change</span>
            <span class="evidence-value font-numeric ${e.changePercent > 0 ? "text-negative" : "text-positive"}">
              ${e.changePercent > 0 ? "+" : ""}${formatPercent(e.changePercent)}
            </span>
          </div>
        </div>
      `;
    }

    case "TOP_SPENDING_CATEGORY": {
      const e = evidence as {
        category: string;
        totalSpending: bigint;
        percentOfTotal: number;
        transactionCount: number;
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">Category</span>
            <span class="evidence-value">${escapeHtml(e.category)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Total Outflow</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.totalSpending)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Share of Total Spending</span>
            <span class="evidence-value font-numeric">${formatPercent(e.percentOfTotal)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Transaction Count</span>
            <span class="evidence-value">${e.transactionCount} transactions</span>
          </div>
        </div>
      `;
    }

    case "TOP_MERCHANT": {
      const e = evidence as {
        merchant: string;
        totalSpending: bigint;
        transactionCount: number;
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">Merchant Name</span>
            <span class="evidence-value">${escapeHtml(e.merchant)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Total Spent</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.totalSpending)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Total Transactions</span>
            <span class="evidence-value">${e.transactionCount} times</span>
          </div>
        </div>
      `;
    }

    case "RECURRING_PAYMENT": {
      const e = evidence as {
        merchant: string;
        estimatedAmount: bigint;
        occurrences: number;
        intervalDays: number;
        confidence: string;
        dates: string[];
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">Merchant</span>
            <span class="evidence-value">${escapeHtml(e.merchant)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Estimated Amount</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.estimatedAmount)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Estimated Cycle</span>
            <span class="evidence-value">Every ~${e.intervalDays} days</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Detection Confidence</span>
            <span class="evidence-value badge-subtle confidence-${escapeHtml(e.confidence)}">${escapeHtml(e.confidence)}</span>
          </div>
        </div>
        <div class="evidence-dates">
          <span class="evidence-label">Recorded Occurrences (${e.occurrences}):</span>
          <div class="date-chips">
            ${e.dates.map((d) => `<span class="chip">${formatDisplayDate(d)}</span>`).join("")}
          </div>
        </div>
      `;
    }

    case "UNUSUAL_TRANSACTION": {
      const e = evidence as {
        date: string;
        amount: bigint;
        description: string;
        baseline: bigint;
        reason: string;
        severity: string;
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">Transaction Date</span>
            <span class="evidence-value">${formatDisplayDate(e.date)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Outflow Amount</span>
            <span class="evidence-value font-numeric text-negative">${formatIndianMoney(e.amount)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Historical Median Baseline</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.baseline)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Statistical Deviation</span>
            <span class="evidence-value">${escapeHtml(e.reason)}</span>
          </div>
        </div>
        <div class="evidence-description">
          <span class="evidence-label">Original Description:</span>
          <code>${escapeHtml(e.description)}</code>
        </div>
      `;
    }

    case "SPENDING_CONCENTRATION": {
      const e = evidence as {
        topCount: number;
        topMerchants: string[];
        combinedSpending: bigint;
        totalSpending: bigint;
        percentOfTotal: number;
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">Top Merchants Count</span>
            <span class="evidence-value">${e.topCount} merchants</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Combined Outflow</span>
            <span class="evidence-value font-numeric">${formatIndianMoney(e.combinedSpending)}</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Concentration Share</span>
            <span class="evidence-value font-numeric">${formatPercent(e.percentOfTotal)} of total spend</span>
          </div>
        </div>
        <div class="evidence-merchants">
          <span class="evidence-label">Dominant Merchants:</span>
          <div class="merchant-chips">
            ${e.topMerchants.map((m) => `<span class="chip font-medium">${escapeHtml(m)}</span>`).join("")}
          </div>
        </div>
      `;
    }

    case "RECURRING_SPENDING_TOTAL": {
      const e = evidence as {
        monthlyEstimate: bigint;
        recurringCount: number;
        payments: { merchant: string; amount: bigint; intervalDays: number }[];
      };
      return `
        <div class="evidence-grid">
          <div class="evidence-item">
            <span class="evidence-label">Estimated Monthly Bill Burden</span>
            <span class="evidence-value font-numeric font-medium">${formatIndianMoney(e.monthlyEstimate)} / mo</span>
          </div>
          <div class="evidence-item">
            <span class="evidence-label">Identified Streams</span>
            <span class="evidence-value">${e.recurringCount} recurring streams</span>
          </div>
        </div>
        <div class="evidence-payments-list">
          ${e.payments
            .map(
              (p) => `
                <div class="payment-row">
                  <span class="p-merchant font-medium">${escapeHtml(p.merchant)}</span>
                  <span class="p-cycle text-muted">~${p.intervalDays}d cycle</span>
                  <span class="p-amount font-numeric">${formatIndianMoney(p.amount)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    }

    default:
      return `<pre class="raw-evidence">${escapeHtml(JSON.stringify(evidence, null, 2))}</pre>`;
  }
}

export function renderFindingCard(finding: Finding, isExpanded = false, isDominant = false): string {
  const { id, type, severity, title, message } = finding;

  return `
    <article 
      class="finding-card severity-${escapeHtml(severity)} ${isDominant ? "is-dominant" : ""} ${isExpanded ? "is-expanded" : ""}" 
      id="finding-${escapeHtml(id)}" 
      data-finding-id="${escapeHtml(id)}"
    >
      <div class="finding-main">
        <div class="finding-header">
          <div class="tag-group">
            <span class="severity-pill severity-${escapeHtml(severity)}">
              ${severity === "warning" ? "Attention" : severity === "critical" ? "Critical" : "Observation"}
            </span>
            <span class="finding-type-label">${escapeHtml(type.replace(/_/g, " "))}</span>
          </div>
          ${isDominant ? `<span class="badge-hero">THE BIGGEST THING WE FOUND</span>` : ""}
        </div>

        <h3 class="finding-title">${escapeHtml(title)}</h3>
        <p class="finding-message">${escapeHtml(message)}</p>

        <div class="finding-actions">
          <button 
            type="button" 
            class="btn-toggle-evidence" 
            data-target="${escapeHtml(id)}" 
            aria-expanded="${isExpanded}" 
            aria-controls="evidence-${escapeHtml(id)}"
          >
            <span>${isExpanded ? "Hide details" : "See why &amp; evidence"}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon-chevron">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="finding-evidence-drawer ${isExpanded ? "open" : "collapsed"}" id="evidence-${escapeHtml(id)}" role="region" aria-label="Evidence for ${escapeHtml(title)}">
        <div class="evidence-inner">
          <h4 class="evidence-heading">Underlying Deterministic Evidence</h4>
          ${renderEvidenceDetails(finding)}
        </div>
      </div>
    </article>
  `;
}

