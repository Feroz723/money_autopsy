import { describe, expect, it } from "vitest";

import { ingestStatement } from "../src/index.js";
import {
  balanceFailureCsv,
  ambiguousXlsxBytes,
  csvFile,
  genericCsv,
  indianStyleCsv,
  invalidRowsCsv,
  missingOptionalColumnsCsv,
  referenceAndDuplicatesCsv,
  xlsxFile,
} from "./fixtures/statements.js";
import {
  hdfcBankCorruptedBalanceCsv,
  hdfcBankEdgeCaseCsv,
  hdfcBankStatementCsv,
  hdfcNamedGenericCsv,
} from "./fixtures/hdfc-bank.js";
import {
  iciciDetailedCsv,
  iciciDetailedCorruptedBalanceCsv,
  iciciFalsePositiveCsv,
  iciciXlsxFile,
} from "./fixtures/icici-bank-detailed.js";

const fixtureChecks = [
  { name: "generic CSV", file: csvFile("generic.csv", genericCsv), accepted: 3, reliable: true },
  { name: "Indian-style CSV", file: csvFile("indian.csv", indianStyleCsv), accepted: 2, reliable: true },
  { name: "CSV with references and duplicate candidates", file: csvFile("references.csv", referenceAndDuplicatesCsv), accepted: 3, reliable: true },
  { name: "CSV with missing optional columns", file: csvFile("missing.csv", missingOptionalColumnsCsv), accepted: 2, reliable: true },
  { name: "CSV with invalid rows", file: csvFile("invalid.csv", invalidRowsCsv), accepted: 1, reliable: true },
  { name: "CSV with reconciliation failure", file: csvFile("failed.csv", balanceFailureCsv), accepted: 2, reliable: false },
  { name: "XLSX equivalent", file: xlsxFile(), accepted: 3, reliable: true },
  { name: "HDFC Bank statement table", file: csvFile("hdfc.csv", hdfcBankStatementCsv), accepted: 3, reliable: true },
  { name: "HDFC Bank edge-case table", file: csvFile("hdfc-edge.csv", hdfcBankEdgeCaseCsv), accepted: 2, reliable: true },
  { name: "HDFC Bank corrupted-balance table", file: csvFile("hdfc-corrupt.csv", hdfcBankCorruptedBalanceCsv), accepted: 2, reliable: false },
  { name: "HDFC-named generic table", file: csvFile("HDFC-generic.csv", hdfcNamedGenericCsv), accepted: 1, reliable: true },
  { name: "ICICI Bank Detailed Statement", file: csvFile("icici.csv", iciciDetailedCsv), accepted: 5, reliable: true },
  { name: "ICICI Bank corrupted-balance", file: csvFile("icici-corrupt.csv", iciciDetailedCorruptedBalanceCsv), accepted: 2, reliable: false },
  { name: "ICICI false-positive generic", file: csvFile("ICICI-April.csv", iciciFalsePositiveCsv), accepted: 1, reliable: true },
  { name: "ICICI Detailed Statement XLSX", file: iciciXlsxFile(), accepted: 2, reliable: true },
];

describe("synthetic fixture verification", () => {
  for (const fixture of fixtureChecks) {
    it(`verifies ${fixture.name}`, async () => {
      const result = await ingestStatement(fixture.file);
      expect(result.transactions).toHaveLength(fixture.accepted);
      expect(result.reliable).toBe(fixture.reliable);
    });
  }

  it("verifies the ambiguous workbook fixture is rejected safely", async () => {
    await expect(ingestStatement({ name: "ambiguous.xlsx", bytes: ambiguousXlsxBytes() })).rejects.toMatchObject({
      code: "AMBIGUOUS_WORKSHEET",
    });
  });
});