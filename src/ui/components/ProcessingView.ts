import type { AppStage } from "../state.js";

const STAGE_STEPS: { stage: AppStage; label: string }[] = [
  { stage: "reading", label: "Reading statement file into memory..." },
  { stage: "checking", label: "Extracting headers & validating balances..." },
  { stage: "analyzing", label: "Computing cash flow, categories & recurring patterns..." },
];

export function renderProcessingView(currentStage: AppStage, stageMessage: string): string {
  return `
    <section class="processing-section" aria-live="polite" aria-label="Statement processing status">
      <div class="processing-card">
        <div class="spinner-container" aria-hidden="true">
          <div class="spinner"></div>
        </div>

        <h2 class="processing-title">Processing Statement</h2>
        <p class="processing-current-message">${stageMessage || "Working on your financial autopsy..."}</p>

        <div class="stage-stepper" role="list">
          ${STAGE_STEPS.map((step) => {
            const isDone =
              (currentStage === "checking" && step.stage === "reading") ||
              (currentStage === "analyzing" && (step.stage === "reading" || step.stage === "checking")) ||
              currentStage === "ready";
            const isActive = currentStage === step.stage;

            return `
              <div class="step-item ${isDone ? "step-done" : isActive ? "step-active" : "step-pending"}" role="listitem">
                <span class="step-icon" aria-hidden="true">
                  ${
                    isDone
                      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
                      : isActive
                      ? `<span class="step-pulse"></span>`
                      : `<span class="step-dot"></span>`
                  }
                </span>
                <span class="step-label">${step.label}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}
