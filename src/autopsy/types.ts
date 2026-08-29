import type { MinorUnits } from "../ingestion/types.js";
import type { AnomalySeverity, CategoryName, Confidence, PeriodKey } from "../analysis/types.js";

export type FindingType =
  | "SPENDING_INCREASE"
  | "SPENDING_DECREASE"
  | "TOP_SPENDING_CATEGORY"
  | "TOP_MERCHANT"
  | "RECURRING_PAYMENT"
  | "UNUSUAL_TRANSACTION"
  | "SPENDING_CONCENTRATION"
  | "RECURRING_SPENDING_TOTAL";

export type FindingSeverity = "critical" | "warning" | "info";

export interface SpendingChangeEvidence {
  currentPeriod: PeriodKey;
  previousPeriod: PeriodKey;
  currentSpending: MinorUnits;
  previousSpending: MinorUnits;
  changeAmount: MinorUnits;
  changePercent: number;
}

export interface TopCategoryEvidence {
  category: CategoryName;
  totalSpending: MinorUnits;
  percentOfTotal: number;
  transactionCount: number;
}

export interface TopMerchantEvidence {
  merchant: string;
  totalSpending: MinorUnits;
  transactionCount: number;
}

export interface RecurringPaymentEvidence {
  merchant: string;
  estimatedAmount: MinorUnits;
  occurrences: number;
  intervalDays: number;
  confidence: Confidence;
  dates: string[];
}

export interface UnusualTransactionEvidence {
  date: string;
  amount: MinorUnits;
  description: string;
  baseline: MinorUnits;
  reason: string;
  severity: AnomalySeverity;
}

export interface ConcentrationEvidence {
  topCount: number;
  topMerchants: string[];
  combinedSpending: MinorUnits;
  totalSpending: MinorUnits;
  percentOfTotal: number;
}

export interface RecurringTotalEvidence {
  monthlyEstimate: MinorUnits;
  recurringCount: number;
  payments: { merchant: string; amount: MinorUnits; intervalDays: number }[];
}

export type FindingEvidence =
  | SpendingChangeEvidence
  | TopCategoryEvidence
  | TopMerchantEvidence
  | RecurringPaymentEvidence
  | UnusualTransactionEvidence
  | ConcentrationEvidence
  | RecurringTotalEvidence;

export interface Finding {
  id: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  message: string;
  evidence: FindingEvidence;
}

export interface AutopsyResult {
  findings: Finding[];
}
