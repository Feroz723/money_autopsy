import readXlsxFile from "read-excel-file/universal";

import { StatementImportError } from "./errors.js";
import { findHeaderRow, hasLikelyTransactions } from "./headers.js";
import { detectIciciDetailedTable } from "./profiles/icici-bank-detailed.js";
import type { CellValue, DetectedTable } from "./types.js";

function toCellValue(value: unknown): CellValue {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    return value;
  }
  return null;
}

function sheetRows(rows: unknown[][]): CellValue[][] {
  return rows.map((row) => row.map(toCellValue));
}

/** Finds exactly one worksheet with a recognized transaction table, trying generic then ICICI. */
export async function inspectXlsx(bytes: ArrayBuffer): Promise<DetectedTable> {
  try {
    const sheets = await readXlsxFile(bytes);
    const candidates: DetectedTable[] = [];
    const iciciCandidates: DetectedTable[] = [];

    for (const sheet of sheets) {
      const rows = sheetRows(sheet.data);

      const generic = findHeaderRow(rows);
      if (generic !== null && hasLikelyTransactions(generic)) {
        candidates.push(generic);
      }

      const icici = detectIciciDetailedTable(rows);
      if (icici !== null && hasLikelyTransactions(icici)) {
        iciciCandidates.push(icici);
      }
    }

    const allCandidates = [...candidates, ...iciciCandidates];
    if (allCandidates.length === 1) return allCandidates[0] as DetectedTable;
    if (allCandidates.length > 1) {
      throw new StatementImportError(
        "AMBIGUOUS_WORKSHEET",
        "Multiple worksheets contain transaction tables. Export or select one statement table.",
      );
    }

    throw new StatementImportError(
      "NO_TRANSACTION_TABLE",
      "No worksheet containing a recognizable transaction table was found.",
    );
  } catch (error) {
    if (error instanceof StatementImportError) {
      throw error;
    }
    throw new StatementImportError("INVALID_XLSX", "The XLSX file could not be read safely.");
  }
}
