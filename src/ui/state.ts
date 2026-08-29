import type { ImportResult } from "../ingestion/types.js";
import type { AnalysisResult } from "../analysis/types.js";
import type { AutopsyResult } from "../autopsy/types.js";

export type AppStage = "idle" | "reading" | "checking" | "analyzing" | "ready" | "error";

export interface AppState {
  stage: AppStage;
  stageMessage: string;
  error?: string | undefined;
  file?: {
    name: string;
    size: number;
  } | undefined;
  importResult?: ImportResult | undefined;
  analysisResult?: AnalysisResult | undefined;
  autopsyResult?: AutopsyResult | undefined;
  selectedFindingId?: string | null | undefined;
  transactionFilter?: {
    query: string;
    category: string;
    direction: "all" | "debit" | "credit";
  } | undefined;
}

export function createInitialState(): AppState {
  return {
    stage: "idle",
    stageMessage: "",
    transactionFilter: {
      query: "",
      category: "all",
      direction: "all",
    },
  };
}
