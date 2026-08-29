import type { MinorUnits, NormalizedTransaction } from "../ingestion/types.js";

export type PeriodKey = string; // "YYYY-MM"

export interface CashFlowTotals {
  income: MinorUnits;
  spending: MinorUnits;
  net: MinorUnits;
  transactionCount: number;
  incomeCount: number;
  spendingCount: number;
}

export interface PeriodSummary {
  income: MinorUnits;
  spending: MinorUnits;
  net: MinorUnits;
  transactionCount: number;
}

export interface PeriodTrend {
  spendingChange: MinorUnits;
  spendingChangePercent: number | null;
  incomeChange: MinorUnits;
  incomeChangePercent: number | null;
  netChange: MinorUnits;
  netChangePercent: number | null;
}

export interface MerchantSummary {
  merchant: string;
  totalSpending: MinorUnits;
  transactionCount: number;
  averageAmount: MinorUnits;
  largestAmount: MinorUnits;
}

export type CategoryName =
  | "Food & Dining"
  | "Shopping"
  | "Transport"
  | "Bills & Utilities"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Travel"
  | "Financial"
  | "Personal"
  | "Transfers"
  | "Other";

export type Confidence = "high" | "medium" | "low";

export interface CategoryClassification {
  category: CategoryName;
  confidence: Confidence;
  reason: string;
}

export interface CategorySummary {
  category: CategoryName;
  totalSpending: MinorUnits;
  transactionCount: number;
  percentOfTotal: number | null;
}

export interface RecurringPayment {
  merchant: string;
  estimatedAmount: MinorUnits;
  occurrences: number;
  detectedIntervalDays: number;
  confidence: Confidence;
  dates: string[];
}

export type AnomalySeverity = "high" | "medium";

export interface AnomalyFlag {
  transactionIndex: number;
  transaction: NormalizedTransaction;
  reason: string;
  baseline: MinorUnits;
  severity: AnomalySeverity;
}

export type TransferLikelihood = "likely" | "possible";

export interface TransferClassification {
  transactionIndex: number;
  likelihood: TransferLikelihood;
  reason: string;
}

export interface AnalysisResult {
  totals: CashFlowTotals;
  periods: Map<PeriodKey, PeriodSummary>;
  trends: Map<PeriodKey, PeriodTrend>;
  merchants: MerchantSummary[];
  topMerchants: MerchantSummary[];
  categories: CategorySummary[];
  recurringPayments: RecurringPayment[];
  anomalies: AnomalyFlag[];
  transfers: TransferClassification[];
}
