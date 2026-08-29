import { describe, expect, it } from "vitest";

import { ingestStatement } from "../src/index.js";
import {
  hdfcBankCorruptedBalanceCsv,
  hdfcBankEdgeCaseCsv,
  hdfcBankStatementCsv,
  hdfcNamedGenericCsv,
} from "./fixtures/hdfc-bank.js";
import { csvFile } from "./fixtures/statements.js";

describe("HDFC Bank statement table profile", () => {
  it("detects the complete documented header signature and emits exact normalized transactions", async () => {
    const result = await ingestStatement(csvFile("account-statement.csv", hdfcBankStatementCsv));

    expect(result.format).toBe("CSV");
    expect(result.source).toBe("hdfc-bank");
    expect(result.transactions).toEqual([
      {
        date: "2024-04-01",
        description: "UPI-FICTIONAL BAZAAR-fixture@upi-HDFC0000000-500000000001-TEA AND SNACKS",
        debit: 123_450n,
        credit: null,
        balance: 12_376_550n,
        reference: "000000000000001",
        source: "hdfc-bank",
      },
      {
        date: "2024-04-02",
        description: "NEFT CR-FICTIONAL EMPLOYER-APRIL PAYROLL",
        debit: null,
        credit: 2_500_000n,
        balance: 14_876_550n,
        reference: "N000000000000002",
        source: "hdfc-bank",
      },
      {
        date: "2024-04-03",
        description: "UPI-FICTIONAL RENT-fixture@upi-HDFC0000000-500000000003-APRIL RENT",
        debit: 10_000_000n,
        credit: null,
        balance: 4_876_550n,
        reference: "000000000000003",
        source: "hdfc-bank",
      },
    ]);
    expect(result.totals).toEqual({ debit: 10_123_450n, credit: 2_500_000n });
    expect(result.diagnostics).toMatchObject({
      totalRowsInspected: 5,
      transactionsAccepted: 3,
      rowsIgnored: 2,
      rowsRejected: 0,
    });
    expect(result.diagnostics.balanceVerification).toMatchObject({
      status: "verified",
      totalCheck: "verified",
      transitionsChecked: 2,
    });
  });

  it("handles documented long narration, a blank row, and a repeated page-continuation header", async () => {
    const result = await ingestStatement(csvFile("edge-cases.csv", hdfcBankEdgeCaseCsv));

    expect(result.source).toBe("hdfc-bank");
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]?.date).toBe("2024-03-31");
    expect(result.transactions[0]?.description).toContain("ENDS MID-REMARK");
    expect(result.transactions[1]).toMatchObject({
      date: "2024-04-01",
      debit: null,
      credit: 100n,
      balance: 90_000_101n,
    });
    expect(result.diagnostics).toMatchObject({ rowsIgnored: 3, rowsRejected: 0 });
    expect(result.diagnostics.ignoredRowReasons["Repeated column header."]).toBe(1);
    expect(result.diagnostics.balanceVerification.status).toBe("verified");
  });

  it("marks a structurally valid HDFC table unreliable when its balances are corrupted", async () => {
    const result = await ingestStatement(csvFile("corrupted.csv", hdfcBankCorruptedBalanceCsv));

    expect(result.source).toBe("hdfc-bank");
    expect(result.reliable).toBe(false);
    expect(result.diagnostics.balanceVerification).toMatchObject({
      status: "unreliable",
      totalCheck: "failed",
    });
  });

  it("does not identify HDFC from its filename or partial lookalike headers", async () => {
    const result = await ingestStatement(csvFile("HDFC-April.csv", hdfcNamedGenericCsv));

    expect(result.source).toBe("generic");
    expect(result.transactions[0]?.source).toBe("generic");
  });
});
