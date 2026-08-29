import { normalizeDate } from "./date.js";
import { normalizeMoney } from "./money.js";
import type { CellValue, DetectedTable, HeaderMapping } from "./types.js";

type HeaderField = keyof HeaderMapping;

const HEADER_ALIASES: Record<HeaderField, readonly string[]> = {
  date: [
    "date",
    "transaction date",
    "tran date",
    "txn date",
    "value date",
    "post date",
    "posting date",
    "payment date",
    "date time",
    "date & time",
    "dated",
    "time",
  ],
  description: [
    "description",
    "narration",
    "particulars",
    "transaction remarks",
    "remarks",
    "transaction details",
    "details",
    "paid to",
    "received from",
    "payment to",
    "transferred to",
    "beneficiary name",
    "merchant",
    "party name",
    "counterparty",
    "account description",
    "name",
    "paid to received from",
  ],
  debit: [
    "debit",
    "withdrawal",
    "withdrawal amt",
    "withdrawal amount",
    "debit amount",
    "dr",
    "dr amount",
    "paid out",
    "money out",
    "spent",
    "withdrawal inr",
    "debit inr",
  ],
  credit: [
    "credit",
    "deposit",
    "deposit amt",
    "deposit amount",
    "credit amount",
    "cr",
    "cr amount",
    "paid in",
    "money in",
    "received",
    "deposit inr",
    "credit inr",
  ],
  amount: [
    "amount",
    "txn amount",
    "transaction amount",
    "trans amount",
    "total amount",
    "amt",
    "net amount",
    "amount inr",
    "amt inr",
  ],
  type: [
    "type",
    "txn type",
    "transaction type",
    "cr dr",
    "dr cr",
    "cr dr",
    "d c",
    "c d",
    "payment type",
    "payment mode",
    "direction",
    "action",
  ],
  balance: [
    "balance",
    "closing balance",
    "running balance",
    "available balance",
    "account balance",
    "balance inr",
    "bal inr",
    "net balance",
  ],
  reference: [
    "reference",
    "ref no",
    "reference no",
    "reference number",
    "cheque no",
    "chq no",
    "cheque number",
    "chq ref no",
    "transaction id",
    "txn id",
    "tran id",
    "utr",
    "utr no",
    "rrn",
    "order id",
  ],
};

const HEADER_WEIGHTS: Record<HeaderField, number> = {
  date: 4,
  description: 1,
  debit: 3,
  credit: 3,
  amount: 3,
  type: 2,
  balance: 1,
  reference: 1,
};

export function normalizeHeader(value: CellValue): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function mapHeaders(row: CellValue[]): HeaderMapping | null {
  const mapping: Partial<HeaderMapping> = {};

  for (let index = 0; index < row.length; index += 1) {
    const header = normalizeHeader(row[index] ?? null);
    if (header === "") {
      continue;
    }

    for (const field of Object.keys(HEADER_ALIASES) as HeaderField[]) {
      if (mapping[field] === undefined && HEADER_ALIASES[field].includes(header)) {
        mapping[field] = index;
        break;
      }
    }
  }

  const hasDate = mapping.date !== undefined;
  const hasMoney =
    mapping.debit !== undefined || mapping.credit !== undefined || mapping.amount !== undefined;

  if (!hasDate || !hasMoney) {
    return null;
  }
  return mapping as HeaderMapping;
}

function scoreHeaders(headers: HeaderMapping): number {
  return (Object.keys(headers) as HeaderField[]).reduce(
    (score, field) => score + HEADER_WEIGHTS[field],
    0,
  );
}

export function findHeaderRow(rows: CellValue[][]): DetectedTable | null {
  let best: DetectedTable | null = null;
  let bestScore = -1;

  for (let index = 0; index < rows.length; index += 1) {
    const headers = mapHeaders(rows[index] ?? []);
    if (headers === null) {
      continue;
    }
    const score = scoreHeaders(headers);
    if (score > bestScore) {
      best = { rows, headerRowIndex: index, headers };
      bestScore = score;
    }
  }

  return best;
}

export function hasLikelyTransactions(table: DetectedTable): boolean {
  const sampleEnd = Math.min(table.rows.length, table.headerRowIndex + 26);
  for (let index = table.headerRowIndex + 1; index < sampleEnd; index += 1) {
    const row = table.rows[index] ?? [];
    const date = normalizeDate(row[table.headers.date] ?? null);
    if (date.value === null) {
      continue;
    }
    const debit = table.headers.debit === undefined ? null : normalizeMoney(row[table.headers.debit] ?? null);
    const credit = table.headers.credit === undefined ? null : normalizeMoney(row[table.headers.credit] ?? null);
    const amount = table.headers.amount === undefined ? null : normalizeMoney(row[table.headers.amount] ?? null);
    if (
      (debit !== null && debit.value !== null) ||
      (credit !== null && credit.value !== null) ||
      (amount !== null && amount.value !== null)
    ) {
      return true;
    }
  }
  return false;
}
