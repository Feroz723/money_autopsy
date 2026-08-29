import type { AnalysisResult } from "../analysis/types.js";
import { formatIndianMoney, formatPercent } from "./format.js";
import {
  SPENDING_CHANGE_PERCENT_MIN,
  SPENDING_CHANGE_AMOUNT_MIN,
  SPENDING_CHANGE_WARNING_PERCENT,
  CONCENTRATION_TOP_N,
  CONCENTRATION_PERCENT_MIN,
  CONCENTRATION_WARNING_PERCENT,
} from "./thresholds.js";
import type { Finding } from "./types.js";

function bigAbs(v: bigint): bigint {
  return v < 0n ? -v : v;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── A/B: Spending change (most recent period) ──

function spendingChangeFindings(result: AnalysisResult): Finding[] {
  const trendKeys = [...result.trends.keys()];
  if (trendKeys.length === 0) return [];

  const latestKey = trendKeys[trendKeys.length - 1]!;
  const trend = result.trends.get(latestKey)!;
  if (trend.spendingChangePercent === null) return [];

  const pctAbs = Math.abs(trend.spendingChangePercent);
  if (pctAbs < SPENDING_CHANGE_PERCENT_MIN || bigAbs(trend.spendingChange) < SPENDING_CHANGE_AMOUNT_MIN) return [];

  const periodKeys = [...result.periods.keys()];
  const previousKey = periodKeys[periodKeys.indexOf(latestKey) - 1];
  if (previousKey === undefined) return [];

  const cur = result.periods.get(latestKey)!;
  const prev = result.periods.get(previousKey)!;
  const up = trend.spendingChange > 0n;

  return [{
    id: `${up ? "spending-increase" : "spending-decrease"}:${latestKey}`,
    type: up ? "SPENDING_INCREASE" : "SPENDING_DECREASE",
    severity: pctAbs >= SPENDING_CHANGE_WARNING_PERCENT ? "warning" : "info",
    title: up ? "Spending increased" : "Spending decreased",
    message: `Your spending ${up ? "increased" : "decreased"} ${formatPercent(trend.spendingChangePercent)} (${formatIndianMoney(bigAbs(trend.spendingChange))}) compared with ${previousKey}.`,
    evidence: {
      currentPeriod: latestKey,
      previousPeriod: previousKey,
      currentSpending: cur.spending,
      previousSpending: prev.spending,
      changeAmount: trend.spendingChange,
      changePercent: trend.spendingChangePercent,
    },
  }];
}

// ── C: Top spending category ──

function topCategoryFinding(result: AnalysisResult): Finding[] {
  if (result.categories.length === 0 || result.totals.spending === 0n) return [];
  const top = result.categories[0]!;
  if (top.percentOfTotal === null) return [];

  return [{
    id: `top-category:${slugify(top.category)}`,
    type: "TOP_SPENDING_CATEGORY",
    severity: "info",
    title: "Top spending category",
    message: `${top.category} was your largest spending category at ${formatPercent(top.percentOfTotal)} (${formatIndianMoney(top.totalSpending)}).`,
    evidence: {
      category: top.category,
      totalSpending: top.totalSpending,
      percentOfTotal: top.percentOfTotal,
      transactionCount: top.transactionCount,
    },
  }];
}

// ── D: Top merchant ──

function topMerchantFinding(result: AnalysisResult): Finding[] {
  const known = result.topMerchants.find((m) => m.merchant !== "unknown");
  if (known === undefined) return [];

  return [{
    id: `top-merchant:${slugify(known.merchant)}`,
    type: "TOP_MERCHANT",
    severity: "info",
    title: "Top spending merchant",
    message: `Your highest-spend merchant was ${known.merchant} with ${formatIndianMoney(known.totalSpending)} across ${known.transactionCount} transaction${known.transactionCount === 1 ? "" : "s"}.`,
    evidence: {
      merchant: known.merchant,
      totalSpending: known.totalSpending,
      transactionCount: known.transactionCount,
    },
  }];
}

// ── E: Recurring payments ──

function recurringPaymentFindings(result: AnalysisResult): Finding[] {
  return result.recurringPayments.map((r) => ({
    id: `recurring:${slugify(r.merchant)}:${r.detectedIntervalDays}`,
    type: "RECURRING_PAYMENT" as const,
    severity: "info" as const,
    title: "Likely recurring payment",
    message: `Likely recurring payment of ${formatIndianMoney(r.estimatedAmount)} at ${r.merchant} (${r.occurrences} occurrences, ~${r.detectedIntervalDays} days apart).`,
    evidence: {
      merchant: r.merchant,
      estimatedAmount: r.estimatedAmount,
      occurrences: r.occurrences,
      intervalDays: r.detectedIntervalDays,
      confidence: r.confidence,
      dates: r.dates,
    },
  }));
}

// ── F: Unusual transactions ──

function unusualTransactionFindings(result: AnalysisResult): Finding[] {
  return result.anomalies.map((a) => ({
    id: `anomaly:${a.transactionIndex}`,
    type: "UNUSUAL_TRANSACTION" as const,
    severity: a.severity === "high" ? "warning" as const : "info" as const,
    title: "Unusual transaction",
    message: `Transaction on ${a.transaction.date} for ${formatIndianMoney(a.transaction.debit ?? a.transaction.credit ?? 0n)} was unusual compared with your normal spending.`,
    evidence: {
      date: a.transaction.date,
      amount: a.transaction.debit ?? a.transaction.credit ?? 0n,
      description: a.transaction.description ?? "unknown",
      baseline: a.baseline,
      reason: a.reason,
      severity: a.severity,
    },
  }));
}

// ── G: Spending concentration ──

function concentrationFinding(result: AnalysisResult): Finding[] {
  if (result.totals.spending === 0n || result.merchants.length < CONCENTRATION_TOP_N) return [];

  const topN = result.merchants.slice(0, CONCENTRATION_TOP_N);
  const combined = topN.reduce((sum, m) => sum + m.totalSpending, 0n);
  const pct = Number((combined * 10000n) / result.totals.spending) / 100;
  if (pct < CONCENTRATION_PERCENT_MIN) return [];

  return [{
    id: `concentration:${CONCENTRATION_TOP_N}`,
    type: "SPENDING_CONCENTRATION",
    severity: pct >= CONCENTRATION_WARNING_PERCENT ? "warning" : "info",
    title: "Spending concentration",
    message: `Your top ${CONCENTRATION_TOP_N} merchants accounted for ${formatPercent(pct)} of spending.`,
    evidence: {
      topCount: CONCENTRATION_TOP_N,
      topMerchants: topN.map((m) => m.merchant),
      combinedSpending: combined,
      totalSpending: result.totals.spending,
      percentOfTotal: pct,
    },
  }];
}

// ── H: Recurring spending total ──

function recurringSpendingTotalFinding(result: AnalysisResult): Finding[] {
  if (result.recurringPayments.length === 0) return [];

  let monthlyEstimate = 0n;
  const payments = result.recurringPayments.map((r) => {
    const monthly = r.estimatedAmount * 30n / BigInt(r.detectedIntervalDays);
    monthlyEstimate += monthly;
    return { merchant: r.merchant, amount: r.estimatedAmount, intervalDays: r.detectedIntervalDays };
  });

  return [{
    id: "recurring-total",
    type: "RECURRING_SPENDING_TOTAL",
    severity: "info",
    title: "Estimated recurring spending",
    message: `Likely recurring payments account for about ${formatIndianMoney(monthlyEstimate)} per month.`,
    evidence: { monthlyEstimate, recurringCount: result.recurringPayments.length, payments },
  }];
}

// ── Ordering ──

const TYPE_PRIORITY: Record<string, number> = {
  SPENDING_INCREASE: 0, SPENDING_DECREASE: 0,
  UNUSUAL_TRANSACTION: 1,
  SPENDING_CONCENTRATION: 2,
  RECURRING_PAYMENT: 3, RECURRING_SPENDING_TOTAL: 4,
  TOP_SPENDING_CATEGORY: 5,
  TOP_MERCHANT: 6,
};

const SEVERITY_PRIORITY: Record<string, number> = { critical: 0, warning: 1, info: 2 };

export function generateFindings(result: AnalysisResult): Finding[] {
  return [
    ...spendingChangeFindings(result),
    ...unusualTransactionFindings(result),
    ...concentrationFinding(result),
    ...recurringPaymentFindings(result),
    ...recurringSpendingTotalFinding(result),
    ...topCategoryFinding(result),
    ...topMerchantFinding(result),
  ].sort((a, b) => {
    const sev = (SEVERITY_PRIORITY[a.severity] ?? 99) - (SEVERITY_PRIORITY[b.severity] ?? 99);
    return sev !== 0 ? sev : (TYPE_PRIORITY[a.type] ?? 99) - (TYPE_PRIORITY[b.type] ?? 99);
  });
}
