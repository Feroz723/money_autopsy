import type { AnalysisResult } from "../analysis/types.js";
import { generateFindings } from "./findings.js";
import type { AutopsyResult } from "./types.js";

/** Converts deterministic analysis results into evidence-backed findings. Pure, local, no AI. */
export function generateAutopsy(result: AnalysisResult): AutopsyResult {
  return { findings: generateFindings(result) };
}

export type {
  AutopsyResult,
  Finding,
  FindingEvidence,
  FindingSeverity,
  FindingType,
} from "./types.js";
