import type { CellValue } from "./types.js";

export interface DateParseResult {
  value: string | null;
  error?: string;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function resultFromParts(day: number, month: number, year: number): DateParseResult {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return { value: null, error: "Date is not a valid calendar date." };
  }

  return {
    value: `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`,
  };
}

function normalizeTwoDigitYear(value: number): number {
  return value < 80 ? 2000 + value : 1900 + value;
}

function parseExcelSerial(value: number): DateParseResult {
  if (!Number.isFinite(value) || value < 1) {
    return { value: null, error: "Excel date serial is invalid." };
  }

  // Excel's 1900 calendar has a historical leap-year bug; this epoch preserves modern dates.
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000);
  return resultFromParts(date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear());
}

export function normalizeDate(value: CellValue): DateParseResult {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return { value: null, error: "Date is missing." };
  }

  if (value instanceof Date) {
    return resultFromParts(value.getUTCDate(), value.getUTCMonth() + 1, value.getUTCFullYear());
  }

  if (typeof value === "number") {
    return parseExcelSerial(value);
  }

  const text = value.trim();
  const numericMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(text);
  if (numericMatch !== null) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    const sourceYear = Number(numericMatch[3]);
    const year = numericMatch[3]?.length === 2 ? normalizeTwoDigitYear(sourceYear) : sourceYear;
    return resultFromParts(day, month, year);
  }

  const namedMonthMatch = /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/.exec(text);
  if (namedMonthMatch !== null) {
    const month = MONTHS[namedMonthMatch[2]?.slice(0, 3).toLowerCase() ?? ""];
    if (month === undefined) {
      return { value: null, error: "Date month is invalid." };
    }
    return resultFromParts(Number(namedMonthMatch[1]), month, Number(namedMonthMatch[3]));
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (isoMatch !== null) {
    return resultFromParts(Number(isoMatch[3]), Number(isoMatch[2]), Number(isoMatch[1]));
  }

  return { value: null, error: "Date must use a supported India-first format." };
}
