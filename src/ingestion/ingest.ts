import { parseCsv } from "./csv.js";
import { countPossibleDuplicates } from "./duplicates.js";
import { StatementImportError } from "./errors.js";
import { detectFormat } from "./format.js";
import { findHeaderRow } from "./headers.js";
import { normalizeTable } from "./normalize.js";
import { detectStatementProfile } from "./profiles/detect.js";
import { detectIciciDetailedTable } from "./profiles/icici-bank-detailed.js";
import { calculateTotals, reconcileBalances } from "./reconcile.js";
import { inspectPdf } from "./pdf.js";
import { inspectXlsx } from "./xlsx.js";
import type { BrowserStatementFile, CellValue, ImportResult, LocalStatementFile } from "./types.js";

/**
 * Parses a statement fully in memory. It performs no file persistence, logging, or network activity.
 */
export async function ingestStatement(file: LocalStatementFile): Promise<ImportResult> {
  const format = detectFormat(file);
  let table: ReturnType<typeof detectStatementProfile>["table"] | null = null;
  let rows: CellValue[][] | null = null;

  if (format === "CSV") {
    rows = parseCsv(new TextDecoder("utf-8").decode(file.bytes));
    table = findHeaderRow(rows);
    if (table === null) {
      table = detectIciciDetailedTable(rows);
    }
  } else if (format === "XLSX") {
    table = await inspectXlsx(file.bytes);
  } else {
    table = await inspectPdf(file.bytes);
  }

  if (table === null) {
    throw new StatementImportError(
      "NO_TRANSACTION_TABLE",
      "No transaction table with a date and debit or credit column was found.",
    );
  }

  const profile = detectStatementProfile(table);
  const normalized = normalizeTable(profile.table, profile.source);
  const balanceVerification = reconcileBalances(
    normalized.transactions,
    normalized.transactionRowNumbers,
    profile.table.headers.balance !== undefined,
    normalized.balanceMarkers,
  );
  const totals = calculateTotals(normalized.transactions);

  return {
    format,
    source: profile.source,
    transactions: normalized.transactions,
    totals,
    diagnostics: {
      totalRowsInspected: normalized.totalRowsInspected,
      transactionsAccepted: normalized.transactions.length,
      rowsIgnored: normalized.rowsIgnored,
      rowsRejected: normalized.rowsRejected,
      rejectedRows: normalized.rejectedRows,
      ignoredRowReasons: normalized.ignoredRowReasons,
      possibleDuplicates: countPossibleDuplicates(normalized.transactions),
      balanceVerification,
    },
    reliable: balanceVerification.status !== "unreliable",
  };
}

export async function ingestBrowserStatement(file: BrowserStatementFile): Promise<ImportResult> {
  return await ingestStatement({
    name: file.name,
    bytes: await file.arrayBuffer(),
    ...(file.type === undefined ? {} : { mimeType: file.type }),
  });
}
