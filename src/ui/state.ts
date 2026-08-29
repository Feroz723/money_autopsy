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
  showAllFindings?: boolean | undefined;
  showAllCategories?: boolean | undefined;
  showAllMerchants?: boolean | undefined;
  showAllTransactions?: boolean | undefined;
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
    showAllFindings: false,
    showAllCategories: false,
    showAllMerchants: false,
    showAllTransactions: false,
    transactionFilter: {
      query: "",
      category: "all",
      direction: "all",
    },
  };
}
