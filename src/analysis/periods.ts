import type { NormalizedTransaction } from "../ingestion/types.js";
import type { PeriodKey, PeriodSummary } from "./types.js";

function periodKey(date: string): PeriodKey {
  return date.slice(0, 7);
}

function emptyPeriod(): PeriodSummary {
  return { income: 0n, spending: 0n, net: 0n, transactionCount: 0 };
}

export function groupByMonth(transactions: NormalizedTransaction[]): Map<PeriodKey, PeriodSummary> {
  const periods = new Map<PeriodKey, PeriodSummary>();

  for (const t of transactions) {
    const key = periodKey(t.date);
    const period = periods.get(key) ?? emptyPeriod();

    if (t.credit !== null) period.income += t.credit;
    if (t.debit !== null) period.spending += t.debit;
    period.net = period.income - period.spending;
    period.transactionCount += 1;

    periods.set(key, period);
  }

  return new Map([...periods.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
