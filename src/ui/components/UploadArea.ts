import { MAX_FILE_SIZE_LABEL } from "../config.js";
import { escapeHtml } from "../formatters.js";

export function renderUploadArea(errorMessage?: string): string {
  return `
    <section class="landing-section" aria-labelledby="landing-heading">
      <div class="landing-hero">
        <h1 id="landing-heading" class="hero-title">
          Find out where your money <span class="text-gradient">actually went</span>.
        </h1>
        <p class="hero-subtitle">
          Drop in a bank statement and get a plain-English breakdown of your spending, income, recurring payments, and unusual transactions.
        </p>
      </div>

      <div class="upload-container">
        <div 
          id="drop-zone" 
          class="drop-zone" 
          tabindex="0" 
          role="button" 
          aria-label="Upload CSV, XLSX, or text PDF bank statement. Drag and drop file here or click to select"
        >
          <div class="drop-zone-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>

          <div class="drop-zone-content">
            <p class="drop-main-text">
              <strong>Click to choose a statement</strong> or drag &amp; drop here
            </p>
            <p class="drop-sub-text">
              Supports <strong>CSV</strong>, <strong>XLSX</strong>, and <strong>text-based PDF</strong> files (up to ${MAX_FILE_SIZE_LABEL})
            </p>
          </div>

          <div class="drop-zone-cta">
            <span class="btn btn-primary" aria-hidden="true">Analyze my statement</span>
          </div>

          <input 
            type="file" 
            id="file-input" 
            class="visually-hidden" 
            accept=".csv,.xlsx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" 
            aria-hidden="true" 
          />
        </div>

        ${
          errorMessage
            ? `
              <div class="alert alert-error" role="alert" aria-live="assertive">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div class="alert-content">
                  <p class="alert-title">Could not process statement</p>
                  <p class="alert-message">${escapeHtml(errorMessage)}</p>
                </div>
              </div>
            `
            : ""
        }

        <div class="upload-assurances">
          <div class="assurance-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <strong>Processed on this device</strong>
              <span>Nothing is uploaded or stored by this app. Zero server transmission.</span>
            </div>
          </div>

          <div class="assurance-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <strong>Exact Reconciliation</strong>
              <span>Deterministic mathematical verification of running balances down to the paise.</span>
            </div>
          </div>

          <div class="assurance-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>Supported Statement Formats</strong>
              <span>CSV, XLSX, and text-based PDFs. Scanned/image-only PDFs aren't supported yet.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Static Example Preview: Shows stranger what they get before uploading -->
      <div class="landing-preview-section" aria-labelledby="preview-heading">
        <div class="preview-header">
          <span class="preview-badge">EXAMPLE PREVIEW</span>
          <h2 id="preview-heading" class="preview-title">What your Money Autopsy looks like</h2>
          <p class="preview-subtitle">Below is a sample of the plain-English findings generated from your statement.</p>
        </div>

        <div class="preview-card" aria-label="Sample Money Autopsy Report">
          <div class="preview-card-header">
            <div class="preview-tag-group">
              <span class="severity-pill severity-warning">Attention</span>
              <span class="preview-type">Spending Pattern</span>
            </div>
            <span class="preview-disclaimer">DEMO CONTENT</span>
          </div>

          <h3 class="preview-finding-headline">Spending increased 24% this month</h3>
          <p class="preview-finding-desc">
            Total outflow rose from ₹38,400 to ₹47,616 driven primarily by dining out and subscription renewals.
          </p>

          <div class="preview-metrics-grid">
            <div class="preview-metric-box">
              <span class="pm-label">Top Category</span>
              <span class="pm-title">Food &amp; Dining</span>
              <span class="pm-stat font-numeric">₹12,400 · 31% of spend</span>
            </div>

            <div class="preview-metric-box">
              <span class="pm-label">Recurring Payment</span>
              <span class="pm-title">Likely Subscriptions</span>
              <span class="pm-stat font-numeric">₹999 · 30-day pattern</span>
            </div>

            <div class="preview-metric-box">
              <span class="pm-label">Merchant Outflow</span>
              <span class="pm-title">Top 3 Merchants</span>
              <span class="pm-stat font-numeric">64% of total spending</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

