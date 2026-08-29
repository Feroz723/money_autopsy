export { StatementImportError } from "./ingestion/errors.js";
export { formatMinorUnits, normalizeMoney } from "./ingestion/money.js";
export { normalizeDate } from "./ingestion/date.js";
export { ingestBrowserStatement, ingestStatement } from "./ingestion/ingest.js";
export type {
  BalanceVerification,
  BrowserStatementFile,
  ImportDiagnostics,
  ImportResult,
  LocalStatementFile,
  MinorUnits,
  NormalizedTransaction,
  SupportedFormat,
} from "./ingestion/types.js";
export { analyzeTransactions } from "./analysis/index.js";
export {
  calculateCashFlow,
  groupByMonth,
  calculateTrends,
  extractMerchant,
  groupByMerchant,
  topSpendingMerchants,
  classifyTransaction,
  calculateCategorySpending,
  detectRecurring,
  detectAnomalies,
  classifyTransfers,
} from "./analysis/index.js";
export type {
  AnalysisResult,
  AnomalyFlag,
  CashFlowTotals,
  CategoryClassification,
  CategoryName,
  CategorySummary,
  Confidence,
  MerchantSummary,
  PeriodKey,
  PeriodSummary,
  PeriodTrend,
  RecurringPayment,
  TransferClassification,
} from "./analysis/index.js";
export { generateAutopsy } from "./autopsy/index.js";
export type {
  AutopsyResult,
  Finding,
  FindingEvidence,
  FindingSeverity,
  FindingType,
} from "./autopsy/index.js";
