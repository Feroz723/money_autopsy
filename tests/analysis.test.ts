import { describe, expect, it } from "vitest";
import type { NormalizedTransaction } from "../src/ingestion/types.js";
import {
  analyzeTransactions,
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
} from "../src/analysis/index.js";
import { analysisTransactions } from "./fixtures/analysis.js";

function tx(
  date: string,
  description: string | null,
  debit: bigint | null,
  credit: bigint | null,
): NormalizedTransaction {
  return { date, description, debit, credit, balance: null, reference: null, source: "generic" };
}

describe("cash flow totals", () => {
  it("calculates income, spending, net, and counts", () => {
    const totals = calculateCashFlow([
      tx("2026-01-01", "Salary", null, 5_000_000n),
      tx("2026-01-02", "Rent", 1_500_000n, null),
      tx("2026-01-03", "Food", 25_000n, null),
    ]);

    expect(totals.income).toBe(5_000_000n);
    expect(totals.spending).toBe(1_525_000n);
    expect(totals.net).toBe(3_475_000n);
    expect(totals.transactionCount).toBe(3);
    expect(totals.incomeCount).toBe(1);
    expect(totals.spendingCount).toBe(2);
  });

  it("returns zeros for empty transaction list", () => {
    const totals = calculateCashFlow([]);
    expect(totals.income).toBe(0n);
    expect(totals.spending).toBe(0n);
    expect(totals.net).toBe(0n);
    expect(totals.transactionCount).toBe(0);
  });

  it("handles single income transaction", () => {
    const totals = calculateCashFlow([tx("2026-01-01", "Salary", null, 100n)]);
    expect(totals.income).toBe(100n);
    expect(totals.spending).toBe(0n);
    expect(totals.net).toBe(100n);
  });
});

describe("period analysis", () => {
  it("groups transactions into monthly periods", () => {
    const periods = groupByMonth([
      tx("2026-01-01", "A", null, 100n),
      tx("2026-01-15", "B", 50n, null),
      tx("2026-02-01", "C", null, 200n),
    ]);

    expect([...periods.keys()]).toEqual(["2026-01", "2026-02"]);
    expect(periods.get("2026-01")).toMatchObject({ income: 100n, spending: 50n, net: 50n, transactionCount: 2 });
    expect(periods.get("2026-02")).toMatchObject({ income: 200n, spending: 0n, net: 200n, transactionCount: 1 });
  });

  it("returns periods in chronological order", () => {
    const periods = groupByMonth([
      tx("2026-03-01", "C", 10n, null),
      tx("2026-01-01", "A", 10n, null),
      tx("2026-02-01", "B", 10n, null),
    ]);
    expect([...periods.keys()]).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("handles single month", () => {
    const periods = groupByMonth([tx("2026-05-15", "X", 100n, null)]);
    expect(periods.size).toBe(1);
    expect(periods.get("2026-05")!.transactionCount).toBe(1);
  });
});

describe("spending trends", () => {
  it("calculates month-over-month spending change", () => {
    const periods = groupByMonth([
      tx("2026-01-01", "A", 100_00n, null),
      tx("2026-02-01", "B", 150_00n, null),
    ]);
    const trends = calculateTrends(periods);

    expect(trends.has("2026-01")).toBe(false);
    expect(trends.get("2026-02")!.spendingChange).toBe(50_00n);
    expect(trends.get("2026-02")!.spendingChangePercent).toBe(50);
  });

  it("returns null percentage when previous spending is zero", () => {
    const periods = groupByMonth([
      tx("2026-01-01", "A", null, 100n),
      tx("2026-02-01", "B", 50n, null),
    ]);
    const trends = calculateTrends(periods);
    expect(trends.get("2026-02")!.spendingChangePercent).toBeNull();
  });

  it("shows -100% when current spending drops to zero", () => {
    const periods = groupByMonth([
      tx("2026-01-01", "A", 100_00n, null),
      tx("2026-02-01", "B", null, 50n),
    ]);
    const trends = calculateTrends(periods);
    expect(trends.get("2026-02")!.spendingChange).toBe(-100_00n);
    expect(trends.get("2026-02")!.spendingChangePercent).toBe(-100);
  });
});

describe("merchant extraction", () => {
  it("strips UPI prefix and handle", () => {
    expect(extractMerchant("UPI-RAHUL STORE-rahul@upi-HDFC0000001-REF123")).toBe("rahul store");
  });

  it("strips NEFT prefix", () => {
    expect(extractMerchant("NEFT CR-FICTIONAL EMPLOYER-SALARY")).toBe("fictional employer-salary");
  });

  it("strips IMPS prefix", () => {
    expect(extractMerchant("IMPS CR-FICTIONAL REFUND-ORDER 987654")).toBe("fictional refund-order 987654");
  });

  it("returns 'unknown' for null description", () => {
    expect(extractMerchant(null)).toBe("unknown");
  });

  it("returns 'unknown' for empty string", () => {
    expect(extractMerchant("")).toBe("unknown");
  });

  it("groups similar UPI descriptions together", () => {
    const a = extractMerchant("UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000001-FOOD ORDER");
    const b = extractMerchant("UPI-SWIGGY-swiggy@upi-HDFC0000001-800000000005-DINNER");
    expect(a).toBe(b);
  });
});

describe("merchant grouping", () => {
  it("groups debit transactions by merchant and calculates stats", () => {
    const merchants = groupByMerchant([
      tx("2026-01-01", "UPI-SWIGGY-swiggy@upi-FOOD", 100n, null),
      tx("2026-01-02", "UPI-SWIGGY-swiggy@upi-DINNER", 200n, null),
      tx("2026-01-03", "SALARY", null, 5000n),
    ]);

    const swiggy = merchants.find((m) => m.merchant === "swiggy");
    expect(swiggy).toBeDefined();
    expect(swiggy!.totalSpending).toBe(300n);
    expect(swiggy!.transactionCount).toBe(2);
    expect(swiggy!.averageAmount).toBe(150n);
    expect(swiggy!.largestAmount).toBe(200n);
  });

  it("does not include income transactions in merchant spending", () => {
    const merchants = groupByMerchant([tx("2026-01-01", "SALARY", null, 5000n)]);
    expect(merchants).toHaveLength(0);
  });

  it("uses 'unknown' for null descriptions", () => {
    const merchants = groupByMerchant([tx("2026-01-01", null, 100n, null)]);
    expect(merchants[0]!.merchant).toBe("unknown");
  });
});

describe("top spending merchants", () => {
  it("returns merchants sorted by spending descending", () => {
    const merchants = groupByMerchant([
      tx("2026-01-01", "Small Merchant", 10n, null),
      tx("2026-01-02", "Big Merchant", 1000n, null),
    ]);
    const top = topSpendingMerchants(merchants, 10);
    expect(top[0]!.merchant).toBe("big merchant");
  });
});

describe("category classification", () => {
  it("classifies Swiggy as Food & Dining with high confidence", () => {
    const result = classifyTransaction(tx("2026-01-01", "UPI-SWIGGY-swiggy@upi-FOOD", 100n, null));
    expect(result.category).toBe("Food & Dining");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("swiggy");
  });

  it("classifies Uber as Transport", () => {
    const result = classifyTransaction(tx("2026-01-01", "UPI-UBER INDIA-uber@upi-RIDE", 100n, null));
    expect(result.category).toBe("Transport");
  });

  it("classifies Netflix as Entertainment", () => {
    const result = classifyTransaction(tx("2026-01-01", "NETFLIX SUBSCRIPTION", 100n, null));
    expect(result.category).toBe("Entertainment");
  });

  it("classifies electricity as Bills & Utilities", () => {
    const result = classifyTransaction(tx("2026-01-01", "ELECTRICITY BILL PAYMENT", 100n, null));
    expect(result.category).toBe("Bills & Utilities");
  });

  it("falls back to Other with low confidence for unknown descriptions", () => {
    const result = classifyTransaction(tx("2026-01-01", "RANDOM XYZ 12345", 100n, null));
    expect(result.category).toBe("Other");
    expect(result.confidence).toBe("low");
    expect(result.reason).toBe("no keyword match");
  });
});

describe("category spending", () => {
  it("calculates spending per category with percentages", () => {
    const categories = calculateCategorySpending([
      tx("2026-01-01", "UPI-SWIGGY-swiggy@upi-FOOD", 100n, null),
      tx("2026-01-02", "UPI-UBER-uber@upi-RIDE", 100n, null),
      tx("2026-01-03", "SALARY", null, 5000n),
    ]);

    expect(categories).toHaveLength(2);
    const food = categories.find((c) => c.category === "Food & Dining");
    expect(food!.totalSpending).toBe(100n);
    expect(food!.percentOfTotal).toBe(50);
  });

  it("returns null percentage when total spending is zero", () => {
    const categories = calculateCategorySpending([tx("2026-01-01", "SALARY", null, 100n)]);
    expect(categories).toHaveLength(0);
  });
});

describe("recurring payment detection", () => {
  it("detects monthly Netflix subscription", () => {
    const recurring = detectRecurring([
      tx("2026-01-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-02-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-03-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-04-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
    ]);

    expect(recurring.length).toBeGreaterThanOrEqual(1);
    const netflix = recurring.find((r) => r.merchant.includes("netflix"));
    expect(netflix).toBeDefined();
    expect(netflix!.occurrences).toBe(4);
    expect(netflix!.detectedIntervalDays).toBeGreaterThanOrEqual(28);
    expect(netflix!.detectedIntervalDays).toBeLessThanOrEqual(31);
    expect(netflix!.confidence).toBe("high");
  });

  it("does not classify fewer than 3 occurrences as recurring", () => {
    const recurring = detectRecurring([
      tx("2026-01-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-02-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
    ]);
    expect(recurring).toHaveLength(0);
  });

  it("does not group different merchants together", () => {
    const recurring = detectRecurring([
      tx("2026-01-07", "NETFLIX", 64_900n, null),
      tx("2026-02-07", "SPOTIFY", 64_900n, null),
      tx("2026-03-07", "YOUTUBE", 64_900n, null),
    ]);
    expect(recurring).toHaveLength(0);
  });

  it("does not flag transactions with wildly different amounts", () => {
    const recurring = detectRecurring([
      tx("2026-01-07", "SHOP A", 100n, null),
      tx("2026-02-07", "SHOP A", 50_000n, null),
      tx("2026-03-07", "SHOP A", 200n, null),
    ]);
    expect(recurring).toHaveLength(0);
  });
});

describe("anomaly detection", () => {
  it("returns empty when fewer than 5 debit transactions", () => {
    const anomalies = detectAnomalies([
      tx("2026-01-01", "A", 100n, null),
      tx("2026-01-02", "B", 200n, null),
    ]);
    expect(anomalies).toHaveLength(0);
  });

  it("does not flag normal transactions", () => {
    const normal = Array.from({ length: 10 }, (_, i) =>
      tx(`2026-01-${String(i + 1).padStart(2, "0")}`, `Item ${i}`, 100_00n, null),
    );
    const anomalies = detectAnomalies(normal);
    expect(anomalies).toHaveLength(0);
  });

  it("flags an unusually large transaction", () => {
    // Use varied amounts so MAD is nonzero (identical amounts → MAD=0 → no detection, which is correct)
    const transactions = [
      tx("2026-01-01", "Normal 0", 90_00n, null),
      tx("2026-01-02", "Normal 1", 100_00n, null),
      tx("2026-01-03", "Normal 2", 110_00n, null),
      tx("2026-01-04", "Normal 3", 95_00n, null),
      tx("2026-01-05", "Normal 4", 105_00n, null),
      tx("2026-01-06", "Normal 5", 102_00n, null),
      tx("2026-01-07", "Normal 6", 98_00n, null),
      tx("2026-01-08", "Normal 7", 108_00n, null),
      tx("2026-01-09", "Normal 8", 92_00n, null),
      tx("2026-01-10", "Normal 9", 103_00n, null),
      tx("2026-01-20", "MASSIVE PURCHASE", 500_000_00n, null),
    ];
    const anomalies = detectAnomalies(transactions);
    expect(anomalies.length).toBeGreaterThanOrEqual(1);
    expect(anomalies[0]!.reason).toContain("Unusually large");
  });

  it("returns empty when all amounts are identical (MAD=0)", () => {
    const transactions = Array.from({ length: 10 }, (_, i) =>
      tx(`2026-01-${String(i + 1).padStart(2, "0")}`, `Same ${i}`, 500n, null),
    );
    expect(detectAnomalies(transactions)).toHaveLength(0);
  });
});

describe("transfer classification", () => {
  it("detects self-transfer keywords", () => {
    const transfers = classifyTransfers([
      tx("2026-01-01", "SELF TRANSFER TO SAVINGS", 500n, null),
    ]);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]!.likelihood).toBe("likely");
  });

  it("detects fund transfer as possible", () => {
    const transfers = classifyTransfers([
      tx("2026-01-01", "FUND TRANSFER TO OTHER ACCOUNT", 200n, null),
    ]);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]!.likelihood).toBe("possible");
  });

  it("does not flag normal transactions", () => {
    const transfers = classifyTransfers([
      tx("2026-01-01", "UPI-SWIGGY-swiggy@upi-FOOD", 100n, null),
    ]);
    expect(transfers).toHaveLength(0);
  });
});

describe("full analysis integration", () => {
  it("produces a complete analysis result from the synthetic dataset", () => {
    const result = analyzeTransactions(analysisTransactions);

    expect(result.totals.transactionCount).toBe(analysisTransactions.length);
    expect(result.totals.net).toBe(result.totals.income - result.totals.spending);
    expect(result.periods.size).toBe(4);
    expect([...result.periods.keys()]).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]);
    expect(result.trends.size).toBe(3);
    expect(result.merchants.length).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.transfers.length).toBeGreaterThanOrEqual(1);
  });
});
