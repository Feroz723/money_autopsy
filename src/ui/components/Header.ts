import type { AppState } from "../state.js";

export function renderHeader(state: AppState): string {
  const showReset = state.stage === "ready" || state.stage === "error";

  return `
    <header class="app-header">
      <div class="header-content">
        <div class="brand">
          <div class="brand-logo" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">Money Autopsy</span>
            <span class="brand-tagline">Deterministic Financial Intelligence</span>
          </div>
        </div>

        <div class="header-actions">
          <div class="privacy-badge" title="No file or financial data is ever uploaded to any server.">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Local &amp; Private: In-Browser Only</span>
          </div>
          ${
            showReset
              ? `<button id="btn-reset" class="btn btn-secondary" type="button" aria-label="Analyze another statement">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  <span>New Statement</span>
                </button>`
              : ""
          }
        </div>
      </div>
    </header>
  `;
}
