import { describe, expect, it } from "vitest";

import { ingestStatement, StatementImportError } from "../src/index.js";
import {
  iciciDetailedCsv,
  iciciDetailedCorruptedBalanceCsv,
  iciciFalsePositiveCsv,
  iciciXlsxFile,
} from "./fixtures/icici-bank-detailed.js";
import { csvFile } from "./fixtures/statements.js";

describe("ICICI Bank Detailed Statement profile", () => {
  it("detects the complete header signature and emits normalized transactions", async () => {
    const result = await ingestStatement(csvFile("icici-detailed.csv", iciciDetailedCsv));

    expect(result.format).toBe("CSV");
    expect(result.source).toBe("icici-bank-detailed");
    expect(result.transactions).toHaveLength(5);
    expect(result.transactions[0]).toMatchObject({
      date: "2024-04-01",
      description: "UPI-FICTIONAL MERCHANT-fixture@upi-ICIC0000000-600000000001-COFFEE",
      debit: 150_000n,
      credit: null,
      balance: 4_850_000n,
      reference: "FICT-REF-001",
      source: "icici-bank-detailed",
    });
    expect(result.transactions[1]).toMatchObject({
      date: "2024-04-02",
      description: "NEFT CR-FICTIONAL SALARY-APRIL 2024",
      debit: null,
      credit: 10_000_000n,
      balance: 14_850_000n,
      reference: "-",
      source: "icici-bank-detailed",
    });
    expect(result.transactions[2]).toMatchObject({
      date: "2024-04-02",
      debit: 120_050n,
      credit: null,
      balance: 14_729_950n,
      reference: "FICT-REF-003",
    });
    expect(result.transactions[3]).toMatchObject({
      date: "2024-04-03",
      description: "IMPS CR-FICTIONAL REFUND-ORDER 987654",
      debit: null,
      credit: 500_000n,
      balance: 15_229_950n,
      reference: "FICT-REF-004",
    });
    expect(result.transactions[4]).toMatchObject({
      date: "2024-04-03",
      debit: null,
      credit: 25_000n,
      balance: 15_254_950n,
      reference: "-",
    });
  });

  it("uses Transaction Date not Value Date as the canonical date", async () => {
    const result = await ingestStatement(csvFile("icici-detailed.csv", iciciDetailedCsv));

    // Transaction 3 has Value Date 05/04/2024 but Transaction Date 03/04/2024
    const row = result.transactions[3];
    expect(row?.date).toBe("2024-04-03");
    expect(row?.date).not.toBe("2024-04-05");
  });

  it("handles same-day transactions and different Value/Transaction dates", async () => {
    const result = await ingestStatement(csvFile("icici-detailed.csv", iciciDetailedCsv));

    // Transactions 1 and 2 both have Transaction Date 02/04/2024
    const sameDayTransactions = result.transactions.filter((t) => t.date === "2024-04-02");
    expect(sameDayTransactions).toHaveLength(2);

    // Last two transactions have diff dates (03/04/2024 vs 05/04/2024)
    const three = result.transactions[3];
    const four = result.transactions[4];
    expect(three?.date).toBe(four?.date);
  });

  it("computes exact totals and verifies reconciliation", async () => {
    const result = await ingestStatement(csvFile("icici-detailed.csv", iciciDetailedCsv));

    expect(result.totals).toEqual({ debit: 270_050n, credit: 10_525_000n });
    expect(result.diagnostics).toMatchObject({
      totalRowsInspected: 8,
      transactionsAccepted: 5,
      rowsIgnored: 3,
      rowsRejected: 0,
    });
    expect(result.diagnostics.balanceVerification).toMatchObject({
      status: "verified",
      totalCheck: "verified",
      transitionsChecked: 4,
    });
    expect(result.reliable).toBe(true);
  });

  it("marks a corrupted-balance fixture as unreliable", async () => {
    const result = await ingestStatement(csvFile("icici-corrupted.csv", iciciDetailedCorruptedBalanceCsv));

    expect(result.source).toBe("icici-bank-detailed");
    expect(result.reliable).toBe(false);
    expect(result.diagnostics.balanceVerification).toMatchObject({
      status: "unreliable",
      totalCheck: "failed",
    });
  });

  it("rejects a false-positive fixture where the ICICI signature is incomplete", async () => {
    const result = await ingestStatement(csvFile("ICICI-April.csv", iciciFalsePositiveCsv));

    expect(result.source).toBe("generic");
    expect(result.transactions[0]?.source).toBe("generic");
  });

  it("detects the same profile from an XLSX workbook", async () => {
    const result = await ingestStatement(iciciXlsxFile());

    expect(result.format).toBe("XLSX");
    expect(result.source).toBe("icici-bank-detailed");
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2024-04-01",
      debit: 150_000n,
      credit: null,
      reference: "XLSX-REF-001",
    });
    expect(result.transactions[1]).toMatchObject({
      date: "2024-04-02",
      debit: null,
      credit: 10_000_000n,
      reference: "-",
    });
    expect(result.diagnostics.balanceVerification.status).toBe("verified");
    expect(result.reliable).toBe(true);
  });

  it("returns a controlled error when no transaction table is found", async () => {
    const emptyCsv = "header,without,transaction,columns\n1,2,3,4";
    await expect(ingestStatement(csvFile("empty.csv", emptyCsv))).rejects.toThrow(StatementImportError);
  });
});