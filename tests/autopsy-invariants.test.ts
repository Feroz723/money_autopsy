import { describe, expect, it } from "vitest";
import { analyzeTransactions } from "../src/analysis/index.js";
import { generateAutopsy } from "../src/autopsy/index.js";
import { analysisTransactions } from "./fixtures/analysis.js";

describe("autopsy invariants", () => {
  const analysis = analyzeTransactions(analysisTransactions);
  const { findings } = generateAutopsy(analysis);

  it("every finding has non-empty evidence", () => {
    for (const f of findings) {
      expect(f.evidence).toBeDefined();
      expect(f.evidence).not.toBeNull();
      expect(typeof f.evidence).toBe("object");
      expect(Object.keys(f.evidence).length).toBeGreaterThan(0);
    }
  });

  it("every finding ID is unique", () => {
    const ids = findings.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("findings are deterministic", () => {
    const a = generateAutopsy(analysis);
    const b = generateAutopsy(analysis);
    expect(a.findings.length).toBe(b.findings.length);
    for (let i = 0; i < a.findings.length; i += 1) {
      expect(a.findings[i]!.id).toBe(b.findings[i]!.id);
      expect(a.findings[i]!.type).toBe(b.findings[i]!.type);
      expect(a.findings[i]!.severity).toBe(b.findings[i]!.severity);
      expect(a.findings[i]!.message).toBe(b.findings[i]!.message);
    }
  });

  it("no finding message contains NaN", () => {
    for (const f of findings) {
      expect(f.message).not.toContain("NaN");
    }
  });

  it("no finding message contains Infinity", () => {
    for (const f of findings) {
      expect(f.message).not.toContain("Infinity");
    }
  });

  it("no finding message contains undefined", () => {
    for (const f of findings) {
      expect(f.message).not.toContain("undefined");
    }
  });

  it("no finding message contains raw account numbers", () => {
    for (const f of findings) {
      // Account numbers are typically 10+ consecutive digits not part of money formatting
      // Money formatting uses ₹ prefix and comma grouping, so raw 10+ digit sequences indicate leakage
      const stripped = f.message.replace(/₹[\d,.]+/g, "");
      expect(/\d{10,}/.test(stripped)).toBe(false);
    }
  });

  it("no finding claims unsupported certainty", () => {
    const certaintyWords = ["guaranteed", "definitely", "certainly", "confirmed subscription", "fraud", "always"];
    for (const f of findings) {
      const lower = f.message.toLowerCase();
      for (const word of certaintyWords) {
        expect(lower).not.toContain(word);
      }
    }
  });

  it("findings generation does not mutate the analysis result", () => {
    const totalsBefore = { ...analysis.totals };
    const findingCountBefore = analysis.anomalies.length;
    generateAutopsy(analysis);
    expect(analysis.totals).toEqual(totalsBefore);
    expect(analysis.anomalies.length).toBe(findingCountBefore);
  });

  it("every severity is a valid value", () => {
    const valid = new Set(["critical", "warning", "info"]);
    for (const f of findings) {
      expect(valid.has(f.severity)).toBe(true);
    }
  });

  it("every type is a valid finding type", () => {
    const valid = new Set([
      "SPENDING_INCREASE", "SPENDING_DECREASE", "TOP_SPENDING_CATEGORY",
      "TOP_MERCHANT", "RECURRING_PAYMENT", "UNUSUAL_TRANSACTION",
      "SPENDING_CONCENTRATION", "RECURRING_SPENDING_TOTAL",
    ]);
    for (const f of findings) {
      expect(valid.has(f.type)).toBe(true);
    }
  });
});
