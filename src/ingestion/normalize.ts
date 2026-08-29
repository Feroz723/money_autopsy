import { mapHeaders } from "./headers.js";
import { normalizeDate } from "./date.js";
import { normalizeMoney } from "./money.js";
import type {
  BalanceMarker,
  CellValue,
  DetectedTable,
  ExtractedBalanceMarkers,
  HeaderMapping,
  MinorUnits,
  NormalizedTableResult,
  NormalizedTransaction,
  SourceIdentifier,
} from "./types.js";

const NON_TRANSACTION_LABELS = [
  "opening balance",
  "closing balance",
  "statement generated",
  "computer generated",
  "this is a system",
  "account number",
  "account no",
  "customer name",
  "customer id",
  "branch name",
  "ifsc",
  "disclaimer",
  "this statement",
  "important information",
  "terms and conditions",
  "for any queries",
  "contact us",
  "end of statement",
];

function valueAt(row: CellValue[], index: number | undefined): CellValue {
  return index === undefined ? null : row[index] ?? null;
}

function textAt(value: CellValue): string | null {
  if (value === null) {
    return null;
  }
  const text = String(value).trim().replace(/\s+/g, " ");
  return text === "" ? null : text;
}

function rowText(row: CellValue[]): string {
  return row
    .map((value) => textAt(value) ?? "")
    .filter((value) => value !== "")
    .join(" ")
    .toLowerCase();
}

function isBlankRow(row: CellValue[]): boolean {
  return row.every((value) => textAt(value) === null);
}

function isRepeatedHeader(row: CellValue[]): boolean {
  return mapHeaders(row) !== null;
}

function isObviousNonTransaction(row: CellValue[]): boolean {
  const text = rowText(row);
  return NON_TRANSACTION_LABELS.some((label) => text.includes(label)) || /^page\s+\d+/i.test(text);
}

function extractBalanceMarker(
  row: CellValue[],
  headers: HeaderMapping,
  rowNumber: number,
): { kind: "opening" | "closing"; marker: BalanceMarker } | null {
  if (headers.balance === undefined) {
    return null;
  }
  const text = rowText(row);
  const kind = text.includes("opening balance") ? "opening" : text.includes("closing balance") ? "closing" : null;
  if (kind === null) {
    return null;
  }
  const balance = normalizeMoney(valueAt(row, headers.balance));
  if (balance.value === null) {
    return null;
  }
  return { kind, marker: { value: balance.value, row: rowNumber } };
}

function parseTransactionAmount(
  value: CellValue,
  field: "debit" | "credit",
): { value: MinorUnits | null; reason: string | null } {
  const parsed = normalizeMoney(value);
  if (parsed.error !== undefined) {
    return { value: null, reason: `Invalid ${field} amount.` };
  }
  if (parsed.value === null || parsed.value === 0n) {
    return { value: null, reason: null };
  }
  if (parsed.value < 0n) {
    return { value: null, reason: `${field[0]?.toUpperCase() ?? ""}${field.slice(1)} amount cannot be negative.` };
  }
  return { value: parsed.value, reason: null };
}

function pushIgnoredReason(reasons: Record<string, number>, reason: string): void {
  reasons[reason] = (reasons[reason] ?? 0) + 1;
}

function normalizeRow(
  row: CellValue[],
  headers: HeaderMapping,
  source: SourceIdentifier,
): { transaction: NormalizedTransaction | null; reason: string | null } {
  const parsedDate = normalizeDate(valueAt(row, headers.date));
  if (parsedDate.value === null) {
    return { transaction: null, reason: "Date is invalid or missing." };
  }

  const debit = parseTransactionAmount(valueAt(row, headers.debit), "debit");
  if (debit.reason !== null) {
    return { transaction: null, reason: debit.reason };
  }
  const credit = parseTransactionAmount(valueAt(row, headers.credit), "credit");
  if (credit.reason !== null) {
    return { transaction: null, reason: credit.reason };
  }
  if (debit.value !== null && credit.value !== null) {
    return { transaction: null, reason: "Both debit and credit amounts are present." };
  }
  if (debit.value === null && credit.value === null) {
    return { transaction: null, reason: "Transaction amount or direction is missing." };
  }

  const description = textAt(valueAt(row, headers.description));
  const reference = textAt(valueAt(row, headers.reference));
  if (description === null && reference === null) {
    return { transaction: null, reason: "Description or reference is missing." };
  }

  const parsedBalance = normalizeMoney(valueAt(row, headers.balance));
  if (parsedBalance.error !== undefined) {
    return { transaction: null, reason: "Balance amount is invalid." };
  }

  return {
    transaction: {
      date: parsedDate.value,
      description,
      debit: debit.value,
      credit: credit.value,
      balance: parsedBalance.value,
      reference,
      source,
    },
    reason: null,
  };
}

/** Applies row-level transaction rules after a semantic header has been found. */
export function normalizeTable(
  table: DetectedTable,
  source: SourceIdentifier = "generic",
): NormalizedTableResult {
  const transactions: NormalizedTransaction[] = [];
  const transactionRowNumbers: number[] = [];
  const rejectedRows: { row: number; reason: string }[] = [];
  const ignoredRowReasons: Record<string, number> = {};
  const balanceMarkers: ExtractedBalanceMarkers = { opening: null, closing: null };
  let rowsIgnored = 0;
  let rowsRejected = 0;

  for (let index = table.headerRowIndex + 1; index < table.rows.length; index += 1) {
    const row = table.rows[index] ?? [];
    const rowNumber = index + 1;
    const marker = extractBalanceMarker(row, table.headers, rowNumber);
    if (marker !== null) {
      balanceMarkers[marker.kind] = marker.marker;
    }

    if (isBlankRow(row)) {
      rowsIgnored += 1;
      pushIgnoredReason(ignoredRowReasons, "Blank row.");
      continue;
    }
    if (isRepeatedHeader(row)) {
      rowsIgnored += 1;
      pushIgnoredReason(ignoredRowReasons, "Repeated column header.");
      continue;
    }
    if (isObviousNonTransaction(row)) {
      rowsIgnored += 1;
      pushIgnoredReason(ignoredRowReasons, "Metadata, summary, or footer row.");
      continue;
    }

    const normalized = normalizeRow(row, table.headers, source);
    if (normalized.transaction === null) {
      rowsRejected += 1;
      rejectedRows.push({ row: rowNumber, reason: normalized.reason ?? "Transaction row is invalid." });
      continue;
    }
    transactions.push(normalized.transaction);
    transactionRowNumbers.push(rowNumber);
  }

  return {
    transactions,
    transactionRowNumbers,
    totalRowsInspected: table.rows.length - table.headerRowIndex - 1,
    rowsIgnored,
    rowsRejected,
    rejectedRows,
    ignoredRowReasons,
    balanceMarkers,
  };
}
