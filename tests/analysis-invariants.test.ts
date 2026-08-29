import { describe, expect, it } from "vitest";
import { analyzeTransactions } from "../src/analysis/index.js";
import { analysisTransactions } from "./fixtures/analysis.js";
import type { NormalizedTransaction } from "../src/ingestion/types.js";

function deepClone(transactions: NormalizedTransaction[]): NormalizedTransaction[] {
  return transactions.map((t) => ({ ...t }));
}

describe("analysis invariants", () => {
  const result = analyzeTransactions(analysisTransactions);

  it("net equals income minus spending", () => {
    expect(result.totals.net).toBe(result.totals.income - result.totals.spending);
  });

  it("total spending equals sum of category spending", () => {
    const categoryTotal = result.categories.reduce((sum, c) => sum + c.totalSpending, 0n);
    expect(categoryTotal).toBe(result.totals.spending);
  });

  it("total spending equals sum of merchant spending", () => {
    const merchantTotal = result.merchants.reduce((sum, m) => sum + m.totalSpending, 0n);
    expect(merchantTotal).toBe(result.totals.spending);
  });

  it("no category percentage exceeds 100", () => {
    for (const c of result.categories) {
      if (c.percentOfTotal !== null) {
        expect(c.percentOfTotal).toBeLessThanOrEqual(100);
        expect(c.percentOfTotal).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("no NaN or Infinity in trend percentages", () => {
    for (const [, trend] of result.trends) {
      for (const pct of [trend.spendingChangePercent, trend.incomeChangePercent, trend.netChangePercent]) {
        if (pct !== null) {
          expect(Number.isNaN(pct)).toBe(false);
          expect(Number.isFinite(pct)).toBe(true);
        }
      }
    }
  });

  it("no NaN or Infinity in category percentages", () => {
    for (const c of result.categories) {
      if (c.percentOfTotal !== null) {
        expect(Number.isNaN(c.percentOfTotal)).toBe(false);
        expect(Number.isFinite(c.percentOfTotal)).toBe(true);
      }
    }
  });

  it("analysis does not mutate source transactions", () => {
    const original = deepClone(analysisTransactions);
    analyzeTransactions(analysisTransactions);
    expect(analysisTransactions).toEqual(original);
  });

  it("same input produces same output (determinism)", () => {
    const a = analyzeTransactions(analysisTransactions);
    const b = analyzeTransactions(analysisTransactions);
    expect(a.totals).toEqual(b.totals);
    expect([...a.periods.entries()]).toEqual([...b.periods.entries()]);
    expect(a.merchants).toEqual(b.merchants);
    expect(a.categories).toEqual(b.categories);
    expect(a.recurringPayments).toEqual(b.recurringPayments);
    expect(a.transfers).toEqual(b.transfers);
  });

  it("period transaction counts sum to total transaction count", () => {
    const periodTotal = [...result.periods.values()].reduce((sum, p) => sum + p.transactionCount, 0);
    expect(periodTotal).toBe(result.totals.transactionCount);
  });

  it("period income sums to total income", () => {
    const periodIncome = [...result.periods.values()].reduce((sum, p) => sum + p.income, 0n);
    expect(periodIncome).toBe(result.totals.income);
  });

  it("period spending sums to total spending", () => {
    const periodSpending = [...result.periods.values()].reduce((sum, p) => sum + p.spending, 0n);
    expect(periodSpending).toBe(result.totals.spending);
  });
});
