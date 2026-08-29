import { describe, expect, it } from "vitest";
import { ingestStatement } from "../src/ingestion/ingest.js";
import { detectFormat } from "../src/ingestion/format.js";
import { analyzeTransactions } from "../src/analysis/index.js";
import { generateAutopsy } from "../src/autopsy/index.js";
import {
  genericPdfBytes,
  hdfcBankPdfBytes,
  iciciBankPdfBytes,
  multiPagePdfBytes,
  wrappedNarrationPdfBytes,
  corruptedBalancePdfBytes,
  scannedEmptyPdfBytes,
  unsupportedLayoutPdfBytes,
} from "./fixtures/pdf-statements.js";

describe("PDF Ingestion & Profile Detection", () => {
  it("detects PDF format correctly", () => {
    expect(detectFormat({ name: "statement.pdf", bytes: new ArrayBuffer(10) })).toBe("PDF");
    expect(detectFormat({ name: "my_statement", mimeType: "application/pdf", bytes: new ArrayBuffer(10) })).toBe("PDF");
  });

  it("ingests a generic text-based statement PDF", async () => {
    const result = await ingestStatement({
      name: "generic_statement.pdf",
      bytes: genericPdfBytes(),
    });

    expect(result.format).toBe("PDF");
    expect(result.source).toBe("generic");
    expect(result.transactions).toHaveLength(3);
    expect(result.reliable).toBe(true);
    expect(result.diagnostics.balanceVerification.status).toBe("verified");

    expect(result.transactions[0]).toMatchObject({
      date: "2026-04-01",
      description: "Salary Deposit",
      credit: 50_000_00n,
      debit: null,
      balance: 1_50_000_00n,
    });
    expect(result.transactions[1]).toMatchObject({
      date: "2026-04-02",
      description: "Grocery Store",
      debit: 1_234_50n,
      credit: null,
      balance: 1_48_765_50n,
    });
    expect(result.transactions[2]).toMatchObject({
      date: "2026-04-05",
      description: "Coffee Shop",
      debit: 250_00n,
      credit: null,
      balance: 1_48_515_50n,
    });

    expect(result.totals.credit).toBe(50_000_00n);
    expect(result.totals.debit).toBe(1_484_50n);
  });

  it("ingests and detects HDFC Bank profile from PDF", async () => {
    const result = await ingestStatement({
      name: "statement.pdf", // Profile is detected from content, not filename
      bytes: hdfcBankPdfBytes(),
    });

    expect(result.format).toBe("PDF");
    expect(result.source).toBe("hdfc-bank");
    expect(result.transactions).toHaveLength(2);
    expect(result.reliable).toBe(true);
    expect(result.transactions[0]!.description).toBe("UPI-SWIGGY-swiggy@upi");
    expect(result.transactions[0]!.debit).toBe(450_00n);
    expect(result.transactions[1]!.description).toBe("NEFT CR-SALARY-APR");
    expect(result.transactions[1]!.credit).toBe(1_00_000_00n);
  });

  it("ingests and detects ICICI Bank Detailed profile from PDF", async () => {
    const result = await ingestStatement({
      name: "statement.pdf",
      bytes: iciciBankPdfBytes(),
    });

    expect(result.format).toBe("PDF");
    expect(result.source).toBe("icici-bank-detailed");
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]!.description).toBe("UPI-Rent Payment");
    expect(result.transactions[0]!.debit).toBe(15_000_00n);
    expect(result.transactions[0]!.balance).toBe(35_000_00n);
  });

  it("handles multi-page PDF statements ignoring repeated headers and page footers", async () => {
    const result = await ingestStatement({
      name: "multipage.pdf",
      bytes: multiPagePdfBytes(),
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.reliable).toBe(true);
    expect(result.transactions[0]!.date).toBe("2026-04-01");
    expect(result.transactions[1]!.date).toBe("2026-04-02");
  });

  it("merges multi-line wrapped narration cleanly", async () => {
    const result = await ingestStatement({
      name: "wrapped.pdf",
      bytes: wrappedNarrationPdfBytes(),
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]!.description).toContain("AMAZON RETAIL INDIA PVT LTD");
    expect(result.transactions[0]!.description).toContain("ORDER ID 402-1234567-8901234");
    expect(result.transactions[0]!.debit).toBe(1_500_00n);
  });

  it("flags balance reconciliation failure on corrupted PDF balance", async () => {
    const result = await ingestStatement({
      name: "corrupted.pdf",
      bytes: corruptedBalancePdfBytes(),
    });

    expect(result.reliable).toBe(false);
    expect(result.diagnostics.balanceVerification.status).toBe("unreliable");
  });

  it("rejects scanned / image-only PDFs with clear error message", async () => {
    await expect(
      ingestStatement({
        name: "scanned.pdf",
        bytes: scannedEmptyPdfBytes(),
      })
    ).rejects.toThrow(/scanned or image-only PDF/);
  });

  it("rejects unsupported PDF layouts containing no transaction table", async () => {
    await expect(
      ingestStatement({
        name: "unsupported.pdf",
        bytes: unsupportedLayoutPdfBytes(),
      })
    ).rejects.toThrow(/No transaction table/);
  });

  it("flows seamlessly into analysis and autopsy findings engine", async () => {
    const result = await ingestStatement({
      name: "generic.pdf",
      bytes: genericPdfBytes(),
    });

    const analysis = analyzeTransactions(result.transactions);
    expect(analysis.totals.spending).toBe(1_484_50n);
    expect(analysis.totals.income).toBe(50_000_00n);
    expect(analysis.totals.net).toBe(48_515_50n);

    const autopsy = generateAutopsy(analysis);
    expect(autopsy.findings.length).toBeGreaterThan(0);
  });
});
