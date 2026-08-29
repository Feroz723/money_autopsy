import type { NormalizedTransaction } from "../ingestion/types.js";
import { extractMerchant } from "./merchants.js";
import type { Confidence, RecurringPayment } from "./types.js";

const KNOWN_INTERVALS = [7, 14, 30, 60, 90];
const INTERVAL_TOLERANCE = 0.2;
const MIN_OCCURRENCES = 3;

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function bigintMedian(values: bigint[]): bigint {
  const sorted = [...values].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2n;
}

function amountsAreSimilar(amounts: bigint[]): boolean {
  const med = bigintMedian(amounts);
  if (med === 0n) return true;
  const tolerance = med * 5n / 100n;
  return amounts.every((a) => {
    const diff = a > med ? a - med : med - a;
    return diff <= tolerance;
  });
}

function matchInterval(medianDays: number): number | null {
  for (const interval of KNOWN_INTERVALS) {
    const tolerance = interval * INTERVAL_TOLERANCE;
    if (Math.abs(medianDays - interval) <= tolerance) return interval;
  }
  return null;
}

function assessConfidence(intervalMatch: number | null, amountsSimilar: boolean): Confidence {
  if (intervalMatch !== null && amountsSimilar) return "high";
  if (intervalMatch !== null || amountsSimilar) return "medium";
  return "low";
}

export function detectRecurring(transactions: NormalizedTransaction[]): RecurringPayment[] {
  const groups = new Map<string, { amounts: bigint[]; dates: string[] }>();

  for (const t of transactions) {
    if (t.debit === null) continue;
    const merchant = extractMerchant(t.description);
    const group = groups.get(merchant) ?? { amounts: [], dates: [] };
    group.amounts.push(t.debit);
    group.dates.push(t.date);
    groups.set(merchant, group);
  }

  const results: RecurringPayment[] = [];

  for (const [merchant, group] of groups) {
    if (group.dates.length < MIN_OCCURRENCES) continue;
    if (!amountsAreSimilar(group.amounts)) continue;

    const sortedDates = [...group.dates].sort();
    const intervals: number[] = [];
    for (let i = 1; i < sortedDates.length; i += 1) {
      intervals.push(daysBetween(sortedDates[i - 1]!, sortedDates[i]!));
    }
    if (intervals.length === 0) continue;

    const medianInterval = median(intervals);
    const intervalMatch = matchInterval(medianInterval);
    const confidence = assessConfidence(intervalMatch, true);

    if (confidence === "low") continue;

    results.push({
      merchant,
      estimatedAmount: bigintMedian(group.amounts),
      occurrences: group.dates.length,
      detectedIntervalDays: intervalMatch ?? Math.round(medianInterval),
      confidence,
      dates: sortedDates,
    });
  }

  return results.sort((a, b) => (b.estimatedAmount > a.estimatedAmount ? 1 : b.estimatedAmount < a.estimatedAmount ? -1 : 0));
}
