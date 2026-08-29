import { normalizeHeader } from "../headers.js";
import type { CellValue, DetectedTable } from "../types.js";

/**
 * Complete 8-column structural signature for the ICICI Bank Detailed Statement.
 *
 * Public evidence (non-account-specific):
 * - statementsift.com: "ICICI Bank Detailed Statement" column layout documented
 *   as S No., Value Date, Transaction Date, Cheque Number, Transaction Remarks,
 *   Withdrawal Amount (INR), Deposit Amount (INR), Balance (INR)
 * - Multiple third-party converter tools reference the same 8-column header
 *   for ICICI Bank's detailed savings/current statement CSV export.
 *
 * This profile matches ONLY this exact table signature.
 * No filename, account number, or narration text is used for identification.
 *
 * Transaction Date (column 2) is used as the canonical date.
 * Value Date (column 1) is a structural marker only and is not retained.
 */
const ICICI_SIGNATURE = [
  "s no",
  "value date",
  "transaction date",
  "cheque number",
  "transaction remarks",
  "withdrawal amount inr",
  "deposit amount inr",
  "balance inr",
] as const;

/** Scans all rows for the ICICI Detailed Statement header signature. */
export function detectIciciDetailedTable(rows: CellValue[][]): DetectedTable | null {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const normalized = row.map((cell) => normalizeHeader(cell));

    if (
      normalized.length >= 8 &&
      normalized[0] === ICICI_SIGNATURE[0] &&
      normalized[1] === ICICI_SIGNATURE[1] &&
      normalized[2] === ICICI_SIGNATURE[2] &&
      normalized[3] === ICICI_SIGNATURE[3] &&
      normalized[4] === ICICI_SIGNATURE[4] &&
      normalized[5] === ICICI_SIGNATURE[5] &&
      normalized[6] === ICICI_SIGNATURE[6] &&
      normalized[7] === ICICI_SIGNATURE[7]
    ) {
      return {
        rows,
        headerRowIndex: index,
        headers: {
          date: 2,
          description: 4,
          debit: 5,
          credit: 6,
          balance: 7,
          reference: 3,
        },
      };
    }
  }
  return null;
}