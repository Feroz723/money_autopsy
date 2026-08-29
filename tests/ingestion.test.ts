import { describe, expect, it, vi } from "vitest";

import {
  StatementImportError,
  formatMinorUnits,
  ingestStatement,
  normalizeDate,
  normalizeMoney,
} from "../src/index.js";
import { findHeaderRow } from "../src/ingestion/headers.js";
import {
  ambiguousXlsxBytes,
  balanceFailureCsv,
  csvFile,
  genericCsv,
  indianStyleCsv,
  invalidRowsCsv,
  missingOptionalColumnsCsv,
  referenceAndDuplicatesCsv,
  xlsxFile,
} from "./fixtures/statements.js";

describe("CSV transaction ingestion", () => {
  it("normalizes a generic CSV with exact totals and reconciled balances", async () => {
    const result = await ingestStatement(csvFile("generic.csv", genericCsv));

    expect(result.format).toBe("CSV");
    expect(result.source).toBe("generic");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-04-01",
      description: "Fictional Salary",
      debit: null,
      credit: 5_000_000n,
      balance: 15_000_000n,
      reference: null,
      source: "generic",
    });
    expect(result.totals).toEqual({ debit: 1_623_450n, credit: 5_000_000n });
    expect(result.diagnostics.balanceVerification).toMatchObject({
      status: "verified",
      totalCheck: "verified",
      transitionsChecked: 2,
    });
    expect(result.reliable).toBe(true);
  });

  it("supports Indian headers, India-first dates, and lakh grouping", async () => {
    const result = await ingestStatement(csvFile("indian.csv", indianStyleCsv));

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-04-03",
      debit: 12_345_600n,
      credit: null,
      balance: 7_654_400n,
    });
    expect(result.transactions[1]).toMatchObject({
      date: "2026-04-04",
      debit: null,
      credit: 100_000n,
    });
    expect(result.diagnostics.balanceVerification.status).toBe("verified");
  });

  it("retains references and flags conservative duplicate candidates without deleting them", async () => {
    const result = await ingestStatement(csvFile("references.csv", referenceAndDuplicatesCsv));

    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0]?.reference).toBe("FICTION-UPI-001");
    expect(result.diagnostics.possibleDuplicates).toBe(1);
    expect(result.diagnostics.balanceVerification.status).toBe("verified");
  });

  it("keeps unavailable optional columns null and leaves balance verification unavailable", async () => {
    const result = await ingestStatement(csvFile("missing-optional.csv", missingOptionalColumnsCsv));

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      debit: 10_000n,
      credit: null,
      balance: null,
      reference: null,
    });
    expect(result.diagnostics.balanceVerification.status).toBe("unavailable");
    expect(result.reliable).toBe(true);
  });

  it("reports invalid rows while ignoring blank, repeated-header, and summary rows", async () => {
    const result = await ingestStatement(csvFile("invalid-rows.csv", invalidRowsCsv));

    expect(result.transactions).toHaveLength(1);
    expect(result.diagnostics).toMatchObject({
      totalRowsInspected: 9,
      transactionsAccepted: 1,
      rowsIgnored: 4,
      rowsRejected: 4,
    });
    expect(result.diagnostics.rejectedRows.map((row) => row.reason)).toEqual([
      "Date is invalid or missing.",
      "Transaction amount or direction is missing.",
      "Description or reference is missing.",
      "Invalid debit amount.",
    ]);
  });

  it("marks a statement unreliable when exact balance reconciliation fails", async () => {
    const result = await ingestStatement(csvFile("balance-failure.csv", balanceFailureCsv));

    expect(result.reliable).toBe(false);
    expect(result.diagnostics.balanceVerification).toMatchObject({
      status: "unreliable",
      totalCheck: "failed",
    });
    expect(result.diagnostics.balanceVerification.message).toBe(
      "Transaction balance reconciliation failed around row 4.",
    );
  });
});

describe("XLSX transaction ingestion", () => {
  it("selects the only transaction sheet rather than assuming the first sheet", async () => {
    const result = await ingestStatement(xlsxFile());

    expect(result.format).toBe("XLSX");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-04-03",
      credit: 5_000_000n,
      reference: "FICTION-001",
    });
    expect(result.transactions[2]).toMatchObject({
      date: "2026-04-05",
      credit: 123_450n,
      balance: 13_623_450n,
    });
    expect(result.diagnostics).toMatchObject({
      rowsIgnored: 3,
      rowsRejected: 0,
    });
    expect(result.diagnostics.balanceVerification.status).toBe("verified");
  });

  it("returns a controlled error instead of guessing between transaction worksheets", async () => {
    const file = { name: "ambiguous.xlsx", bytes: ambiguousXlsxBytes() };

    try {
      await ingestStatement(file);
      throw new Error("Expected XLSX ambiguity error.");
    } catch (error) {
      expect(error).toBeInstanceOf(StatementImportError);
      expect((error as StatementImportError).code).toBe("AMBIGUOUS_WORKSHEET");
      expect((error as Error).message).not.toContain("Fictional item");
    }
  });
});

describe("normalization helpers", () => {
  it("maps whitespace-tolerant headers semantically without positions", () => {
    const table = findHeaderRow([
      ["title row"],
      [" Transaction Date ", " Remarks ", " Debit Amount ", " Credit Amount ", " Ref No. "],
    ]);

    expect(table?.headerRowIndex).toBe(1);
    expect(table?.headers).toEqual({ date: 0, description: 1, debit: 2, credit: 3, reference: 4 });
  });

  it("normalizes Indian dates without applying a US month-first assumption", () => {
    expect(normalizeDate("03/04/2026").value).toBe("2026-04-03");
    expect(normalizeDate("03-04-26").value).toBe("2026-04-03");
    expect(normalizeDate("03 Apr 2026").value).toBe("2026-04-03");
    expect(normalizeDate(46115).value).toBe("2026-04-03");
    expect(normalizeDate("31/04/2026").value).toBeNull();
  });

  it("parses presentation-formatted money into exact minor units", () => {
    expect(normalizeMoney("₹1,234.50").value).toBe(123_450n);
    expect(normalizeMoney("₹ 1,234").value).toBe(123_400n);
    expect(normalizeMoney("1,23,456").value).toBe(12_345_600n);
    expect(normalizeMoney("(1,234.50)").value).toBe(-123_450n);
    expect(normalizeMoney("1,23,45").value).toBeNull();
    expect(formatMinorUnits(12_345_600n)).toBe("123456.00");
  });
});

describe("privacy behavior", () => {
  it("does not log statement values and errors do not echo submitted rows", async () => {
    const spies = [
      vi.spyOn(globalThis.console, "log").mockImplementation(() => {}),
      vi.spyOn(globalThis.console, "info").mockImplementation(() => {}),
      vi.spyOn(globalThis.console, "warn").mockImplementation(() => {}),
      vi.spyOn(globalThis.console, "error").mockImplementation(() => {}),
    ];
    const sensitiveButFictional = `Date,Description,Debit\nnot-a-date,Fictional Account 000000000000,10.00`;

    try {
      await ingestStatement(csvFile("invalid.csv", sensitiveButFictional));
    } finally {
      expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
      spies.forEach((spy) => spy.mockRestore());
    }
  });
});
