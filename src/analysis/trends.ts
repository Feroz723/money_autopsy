import type { MinorUnits } from "../ingestion/types.js";
import type { PeriodKey, PeriodSummary, PeriodTrend } from "./types.js";

function changePercent(change: MinorUnits, previous: MinorUnits): number | null {
  if (previous === 0n) return null;
  return Number((change * 10000n) / previous) / 100;
}

export function calculateTrends(periods: Map<PeriodKey, PeriodSummary>): Map<PeriodKey, PeriodTrend> {
  const trends = new Map<PeriodKey, PeriodTrend>();
  const keys = [...periods.keys()];

  for (let i = 1; i < keys.length; i += 1) {
    const key = keys[i]!;
    const current = periods.get(key)!;
    const previous = periods.get(keys[i - 1]!)!;

    const spendingChange = current.spending - previous.spending;
    const incomeChange = current.income - previous.income;
    const netChange = current.net - previous.net;

    trends.set(key, {
      spendingChange,
      spendingChangePercent: changePercent(spendingChange, previous.spending),
      incomeChange,
      incomeChangePercent: changePercent(incomeChange, previous.income),
      netChange,
      netChangePercent: changePercent(netChange, previous.net < 0n ? -previous.net : previous.net),
    });
  }

  return trends;
}
