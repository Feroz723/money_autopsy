import type { MinorUnits, NormalizedTransaction } from "../ingestion/types.js";
import type { AnomalyFlag } from "./types.js";

const MIN_DEBITS = 5;
const THRESHOLD_MULTIPLIER = 3;
// MAD normalization constant (1.4826 ≈ 14826/10000 to stay in bigint as long as possible)
const MAD_SCALE_NUM = 14826n;
const MAD_SCALE_DEN = 10000n;

function bigintMedian(values: bigint[]): bigint {
  const sorted = [...values].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2n;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function detectAnomalies(transactions: NormalizedTransaction[]): AnomalyFlag[] {
  const debits: { index: number; amount: MinorUnits; transaction: NormalizedTransaction }[] = [];

  for (let i = 0; i < transactions.length; i += 1) {
    const t = transactions[i]!;
    if (t.debit !== null) debits.push({ index: i, amount: t.debit, transaction: t });
  }

  if (debits.length < MIN_DEBITS) return [];

  const amounts = debits.map((d) => d.amount);
  const med = bigintMedian(amounts);
  const deviations = amounts.map((a) => abs(a - med));
  const mad = bigintMedian(deviations);

  if (mad === 0n) return [];

  // threshold = THRESHOLD_MULTIPLIER * MAD * 1.4826
  // Using scaled bigint: threshold = 3 * mad * 14826 / 10000
  const thresholdScaled = BigInt(THRESHOLD_MULTIPLIER) * mad * MAD_SCALE_NUM;

  const anomalies: AnomalyFlag[] = [];

  for (const d of debits) {
    const deviationScaled = abs(d.amount - med) * MAD_SCALE_DEN;
    if (deviationScaled > thresholdScaled) {
      anomalies.push({
        transactionIndex: d.index,
        transaction: d.transaction,
        reason: d.amount > med
          ? `Unusually large: ${formatRatio(d.amount, med)}× the median spending`
          : `Unusually small: ${formatRatio(med, d.amount)}× below the median spending`,
        baseline: med,
        severity: deviationScaled > thresholdScaled * 2n ? "high" : "medium",
      });
    }
  }

  return anomalies;
}

function formatRatio(a: bigint, b: bigint): string {
  if (b === 0n) return "∞";
  return (Number(a * 100n / b) / 100).toFixed(1);
}
