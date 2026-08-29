import type { NormalizedTransaction } from "../ingestion/types.js";
import { detectAnomalies } from "./anomalies.js";
import { calculateCategorySpending } from "./categories.js";
import { groupByMerchant, topSpendingMerchants } from "./merchants.js";
import { groupByMonth } from "./periods.js";
import { detectRecurring } from "./recurring.js";
import { calculateTrends } from "./trends.js";
import { calculateCashFlow } from "./totals.js";
import { classifyTransfers } from "./transfers.js";
import type { AnalysisResult } from "./types.js";

/** Pure, deterministic financial analysis. No mutations, no side effects, no network. */
export function analyzeTransactions(transactions: NormalizedTransaction[]): AnalysisResult {
  const totals = calculateCashFlow(transactions);
  const periods = groupByMonth(transactions);
  const trends = calculateTrends(periods);
  const merchants = groupByMerchant(transactions);
  const topMerchants = topSpendingMerchants(merchants);
  const categories = calculateCategorySpending(transactions);
  const recurringPayments = detectRecurring(transactions);
  const anomalies = detectAnomalies(transactions);
  const transfers = classifyTransfers(transactions);

  return { totals, periods, trends, merchants, topMerchants, categories, recurringPayments, anomalies, transfers };
}

export { calculateCashFlow } from "./totals.js";
export { groupByMonth } from "./periods.js";
export { calculateTrends } from "./trends.js";
export { extractMerchant, groupByMerchant, topSpendingMerchants } from "./merchants.js";
export { classifyTransaction, calculateCategorySpending } from "./categories.js";
export { detectRecurring } from "./recurring.js";
export { detectAnomalies } from "./anomalies.js";
export { classifyTransfers } from "./transfers.js";
export type {
  AnalysisResult,
  AnomalyFlag,
  AnomalySeverity,
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
  TransferLikelihood,
} from "./types.js";
