import { describe, expect, it } from "vitest";
import type { NormalizedTransaction } from "../src/ingestion/types.js";
import { analyzeTransactions } from "../src/analysis/index.js";
import { generateAutopsy } from "../src/autopsy/index.js";
import { formatIndianMoney, formatPercent } from "../src/autopsy/format.js";
import { analysisTransactions } from "./fixtures/analysis.js";

function tx(
  date: string,
  description: string | null,
  debit: bigint | null,
  credit: bigint | null,
): NormalizedTransaction {
  return { date, description, debit, credit, balance: null, reference: null, source: "generic" };
}

// ── Formatting ──

describe("Indian money formatting", () => {
  it("formats small amounts", () => {
    expect(formatIndianMoney(100n)).toBe("₹1.00");
    expect(formatIndianMoney(0n)).toBe("₹0.00");
    expect(formatIndianMoney(50n)).toBe("₹0.50");
  });

  it("formats amounts with standard grouping", () => {
    expect(formatIndianMoney(123_450n)).toBe("₹1,234.50");
  });

  it("formats amounts with Indian lakh grouping", () => {
    expect(formatIndianMoney(12_345_600n)).toBe("₹1,23,456.00");
    expect(formatIndianMoney(1_00_00_000n)).toBe("₹1,00,000.00");
  });

  it("formats negative amounts", () => {
    expect(formatIndianMoney(-500_00n)).toBe("-₹500.00");
  });
});

describe("percentage formatting", () => {
  it("formats to 1 decimal", () => {
    expect(formatPercent(34.27)).toBe("34.3%");
    expect(formatPercent(100)).toBe("100.0%");
    expect(formatPercent(-25.5)).toBe("25.5%");
  });
});

// ── Spending change ──

describe("spending change findings", () => {
  it("produces a spending increase finding when threshold is met", () => {
    const transactions = [
      tx("2026-01-01", "A", 100_000n, null),
      tx("2026-02-01", "B", 200_000n, null),
    ];
    const result = analyzeTransactions(transactions);
    const { findings } = generateAutopsy(result);

    const increase = findings.find((f) => f.type === "SPENDING_INCREASE");
    expect(increase).toBeDefined();
    expect(increase!.severity).toBe("warning");
    expect(increase!.message).toContain("increased");
    expect(increase!.message).toContain("100.0%");
    expect("changePercent" in increase!.evidence).toBe(true);
  });

  it("produces a spending decrease finding", () => {
    const transactions = [
      tx("2026-01-01", "A", 100_000n, null),
      tx("2026-02-01", "B", 10_000n, null),
    ];
    const { findings } = generateAutopsy(analyzeTransactions(transactions));
    const decrease = findings.find((f) => f.type === "SPENDING_DECREASE");
    expect(decrease).toBeDefined();
    expect(decrease!.message).toContain("decreased");
  });

  it("does not produce a finding when change is below threshold", () => {
    const transactions = [
      tx("2026-01-01", "A", 100_000n, null),
      tx("2026-02-01", "B", 102_000n, null),
    ];
    const { findings } = generateAutopsy(analyzeTransactions(transactions));
    expect(findings.find((f) => f.type === "SPENDING_INCREASE")).toBeUndefined();
    expect(findings.find((f) => f.type === "SPENDING_DECREASE")).toBeUndefined();
  });

  it("does not produce a finding when previous spending is zero", () => {
    const transactions = [
      tx("2026-01-01", "Income", null, 100_000n),
      tx("2026-02-01", "Spending", 50_000n, null),
    ];
    const { findings } = generateAutopsy(analyzeTransactions(transactions));
    expect(findings.find((f) => f.type === "SPENDING_INCREASE")).toBeUndefined();
  });

  it("does not produce a finding for single month", () => {
    const { findings } = generateAutopsy(analyzeTransactions([tx("2026-01-15", "A", 100_000n, null)]));
    expect(findings.find((f) => f.type === "SPENDING_INCREASE")).toBeUndefined();
    expect(findings.find((f) => f.type === "SPENDING_DECREASE")).toBeUndefined();
  });
});

// ── Top category ──

describe("top spending category finding", () => {
  it("identifies the largest spending category", () => {
    const { findings } = generateAutopsy(analyzeTransactions(analysisTransactions));
    const topCat = findings.find((f) => f.type === "TOP_SPENDING_CATEGORY");
    expect(topCat).toBeDefined();
    expect(topCat!.message).toContain("largest spending category");
    expect("category" in topCat!.evidence).toBe(true);
    expect("percentOfTotal" in topCat!.evidence).toBe(true);
  });

  it("does not produce when there is no spending", () => {
    const { findings } = generateAutopsy(analyzeTransactions([tx("2026-01-01", "Income", null, 5000n)]));
    expect(findings.find((f) => f.type === "TOP_SPENDING_CATEGORY")).toBeUndefined();
  });
});

// ── Top merchant ──

describe("top merchant finding", () => {
  it("identifies the highest-spend known merchant", () => {
    const { findings } = generateAutopsy(analyzeTransactions(analysisTransactions));
    const topM = findings.find((f) => f.type === "TOP_MERCHANT");
    expect(topM).toBeDefined();
    expect(topM!.message).toContain("highest-spend merchant");
    const evidence = topM!.evidence as { merchant: string };
    expect(evidence.merchant).not.toBe("unknown");
  });

  it("skips when only unknown merchants exist", () => {
    const { findings } = generateAutopsy(analyzeTransactions([tx("2026-01-01", null, 100n, null)]));
    expect(findings.find((f) => f.type === "TOP_MERCHANT")).toBeUndefined();
  });
});

// ── Recurring payments ──

describe("recurring payment findings", () => {
  it("produces findings for strong recurring patterns", () => {
    const recurring = [
      tx("2026-01-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-02-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-03-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-04-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
    ];
    const { findings } = generateAutopsy(analyzeTransactions(recurring));
    const recs = findings.filter((f) => f.type === "RECURRING_PAYMENT");
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs[0]!.title).toBe("Likely recurring payment");
    expect(recs[0]!.message).toContain("Likely");
    expect(recs[0]!.message).not.toContain("confirmed");
  });

  it("does not produce findings with insufficient occurrences", () => {
    const { findings } = generateAutopsy(analyzeTransactions([
      tx("2026-01-07", "NETFLIX", 64_900n, null),
      tx("2026-02-07", "NETFLIX", 64_900n, null),
    ]));
    expect(findings.filter((f) => f.type === "RECURRING_PAYMENT")).toHaveLength(0);
  });
});

// ── Unusual transactions ──

describe("unusual transaction findings", () => {
  it("flags anomalies without fraud language", () => {
    const { findings } = generateAutopsy(analyzeTransactions(analysisTransactions));
    const unusual = findings.filter((f) => f.type === "UNUSUAL_TRANSACTION");
    for (const f of unusual) {
      expect(f.message.toLowerCase()).not.toContain("fraud");
      expect(f.message).toContain("unusual");
    }
  });

  it("does not produce findings with insufficient history", () => {
    const { findings } = generateAutopsy(analyzeTransactions([
      tx("2026-01-01", "A", 100n, null),
      tx("2026-01-02", "B", 100_000n, null),
    ]));
    expect(findings.filter((f) => f.type === "UNUSUAL_TRANSACTION")).toHaveLength(0);
  });
});

// ── Concentration ──

describe("spending concentration finding", () => {
  it("flags high concentration when top merchants dominate", () => {
    // 3 merchants, one dominates
    const transactions = [
      tx("2026-01-01", "BIG MERCHANT", 90_000n, null),
      tx("2026-01-02", "SMALL A", 5_000n, null),
      tx("2026-01-03", "SMALL B", 5_000n, null),
    ];
    const { findings } = generateAutopsy(analyzeTransactions(transactions));
    const conc = findings.find((f) => f.type === "SPENDING_CONCENTRATION");
    expect(conc).toBeDefined();
    expect(conc!.message).toContain("top 3");
  });

  it("does not flag when spending is spread evenly", () => {
    const transactions = Array.from({ length: 10 }, (_, i) =>
      tx(`2026-01-${String(i + 1).padStart(2, "0")}`, `Merchant ${i}`, 100n, null),
    );
    const { findings } = generateAutopsy(analyzeTransactions(transactions));
    expect(findings.find((f) => f.type === "SPENDING_CONCENTRATION")).toBeUndefined();
  });
});

// ── Recurring spending total ──

describe("recurring spending total finding", () => {
  it("estimates monthly recurring total", () => {
    const recurring = [
      tx("2026-01-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-02-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-03-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-04-07", "NETFLIX SUBSCRIPTION", 64_900n, null),
      tx("2026-01-07", "SPOTIFY PREMIUM", 11_900n, null),
      tx("2026-02-07", "SPOTIFY PREMIUM", 11_900n, null),
      tx("2026-03-07", "SPOTIFY PREMIUM", 11_900n, null),
      tx("2026-04-07", "SPOTIFY PREMIUM", 11_900n, null),
    ];
    const { findings } = generateAutopsy(analyzeTransactions(recurring));
    const total = findings.find((f) => f.type === "RECURRING_SPENDING_TOTAL");
    expect(total).toBeDefined();
    expect(total!.message).toContain("about");
    expect(total!.message).toContain("per month");
  });
});

// ── Low data behavior ──

describe("low data behavior", () => {
  it("returns no findings for zero transactions", () => {
    const { findings } = generateAutopsy(analyzeTransactions([]));
    expect(findings).toHaveLength(0);
  });

  it("returns minimal findings for income-only dataset", () => {
    const { findings } = generateAutopsy(analyzeTransactions([
      tx("2026-01-01", "SALARY", null, 5_000_000n),
    ]));
    // No spending → no spending-related findings
    expect(findings.filter((f) => f.type === "TOP_SPENDING_CATEGORY")).toHaveLength(0);
    expect(findings.filter((f) => f.type === "TOP_MERCHANT")).toHaveLength(0);
    expect(findings.filter((f) => f.type === "SPENDING_CONCENTRATION")).toHaveLength(0);
  });

  it("handles single transaction gracefully", () => {
    const { findings } = generateAutopsy(analyzeTransactions([
      tx("2026-01-01", "SINGLE PURCHASE", 100_000n, null),
    ]));
    // Single transaction can't establish trends, recurring, or anomalies
    expect(findings.filter((f) => f.type === "SPENDING_INCREASE")).toHaveLength(0);
    expect(findings.filter((f) => f.type === "RECURRING_PAYMENT")).toHaveLength(0);
    expect(findings.filter((f) => f.type === "UNUSUAL_TRANSACTION")).toHaveLength(0);
  });
});

// ── Finding ordering ──

describe("finding ordering", () => {
  it("orders findings by severity then type priority", () => {
    const { findings } = generateAutopsy(analyzeTransactions(analysisTransactions));
    expect(findings.length).toBeGreaterThan(0);

    // Warning findings should come before info findings
    const firstWarningIdx = findings.findIndex((f) => f.severity === "warning");
    const lastInfoIdx = findings.length - 1 - [...findings].reverse().findIndex((f) => f.severity === "info");
    if (firstWarningIdx !== -1 && lastInfoIdx !== -1) {
      expect(firstWarningIdx).toBeLessThan(lastInfoIdx);
    }
  });
});

// ── Full integration ──

describe("full autopsy integration", () => {
  it("produces multiple findings from the synthetic dataset", () => {
    const result = analyzeTransactions(analysisTransactions);
    const { findings } = generateAutopsy(result);

    expect(findings.length).toBeGreaterThan(1);

    // Every finding has required fields
    for (const f of findings) {
      expect(f.id).toBeTruthy();
      expect(f.type).toBeTruthy();
      expect(f.severity).toBeTruthy();
      expect(f.title).toBeTruthy();
      expect(f.message).toBeTruthy();
      expect(f.evidence).toBeDefined();
    }
  });

  it("does not contain financial advice", () => {
    const { findings } = generateAutopsy(analyzeTransactions(analysisTransactions));
    const advicePatterns = ["cancel", "stop", "invest", "buy", "sell", "take a loan", "you should"];
    for (const f of findings) {
      const lower = f.message.toLowerCase();
      for (const pattern of advicePatterns) {
        expect(lower).not.toContain(pattern);
      }
    }
  });

  it("does not contain moralizing language", () => {
    const { findings } = generateAutopsy(analyzeTransactions(analysisTransactions));
    const badWords = ["waste", "great job", "amazing", "danger", "horrible", "terrible"];
    for (const f of findings) {
      const lower = f.message.toLowerCase();
      for (const word of badWords) {
        expect(lower).not.toContain(word);
      }
    }
  });
});
