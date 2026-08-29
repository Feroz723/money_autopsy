import { normalizeHeader } from "../headers.js";
import type { DetectedTable } from "../types.js";

const HDFC_HEADER_SIGNATURE = [
  "date",
  "narration",
  "chq ref no",
  "value dt",
  "withdrawal amt",
  "deposit amt",
  "closing balance",
] as const;

/**
 * Matches the documented HDFC Bank savings/current statement table, not a filename.
 * `Value Dt` is a structural marker only and is intentionally not retained.
 */
export function detectHdfcBankTable(table: DetectedTable): DetectedTable | null {
  const headerRow = table.rows[table.headerRowIndex] ?? [];
  const headerPositions = new Map<string, number>();

  for (let index = 0; index < headerRow.length; index += 1) {
    const normalized = normalizeHeader(headerRow[index] ?? null);
    if (normalized !== "" && !headerPositions.has(normalized)) {
      headerPositions.set(normalized, index);
    }
  }

  if (!HDFC_HEADER_SIGNATURE.every((header) => headerPositions.has(header))) {
    return null;
  }
  const reference = headerPositions.get("chq ref no");
  if (reference === undefined) {
    return null;
  }

  return {
    ...table,
    headers: {
      ...table.headers,
      reference,
    },
  };
}
