import { normalizeDate } from "./date.js";
import { normalizeMoney } from "./money.js";
import type { CellValue, DetectedTable, HeaderMapping } from "./types.js";

type HeaderField = keyof HeaderMapping;

const HEADER_ALIASES: Record<HeaderField, readonly string[]> = {
  date: ["date", "transaction date", "tran date", "txn date", "value date"],
  description: ["description", "narration", "particulars", "transaction remarks", "remarks"],
  debit: ["debit", "withdrawal", "withdrawal amt", "debit amount"],
  credit: ["credit", "deposit", "deposit amt", "credit amount"],
  balance: ["balance", "closing balance", "running balance"],
  reference: ["reference", "ref no", "cheque no", "chq no", "transaction id", "tran id"],
};

const HEADER_WEIGHTS: Record<HeaderField, number> = {
  date: 4,
  description: 1,
  debit: 3,
  credit: 3,
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

  if (mapping.date === undefined || (mapping.debit === undefined && mapping.credit === undefined)) {
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
    if ((debit !== null && debit.value !== null) || (credit !== null && credit.value !== null)) {
      return true;
    }
  }
  return false;
}
