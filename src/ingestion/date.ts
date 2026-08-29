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

  // Strip trailing timestamps e.g. ", 08:30 PM", " 14:20:00", " at 3:30 pm"
  const text = String(value)
    .trim()
    .replace(/(,\s*|\s+at\s+|\s+)\d{1,2}:\d{2}(:\d{2})?(\s*(am|pm))?/i, "")
    .trim();

  // 1. Numeric: DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const numericMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(text);
  if (numericMatch !== null) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    const sourceYear = Number(numericMatch[3]);
    const year = numericMatch[3]?.length === 2 ? normalizeTwoDigitYear(sourceYear) : sourceYear;
    return resultFromParts(day, month, year);
  }

  // 2. Named month first: "May 12, 2024" or "Apr 01 2022"
  const monthFirstMatch = /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  if (monthFirstMatch !== null) {
    const month = MONTHS[monthFirstMatch[1]?.slice(0, 3).toLowerCase() ?? ""];
    if (month !== undefined) {
      return resultFromParts(Number(monthFirstMatch[2]), month, Number(monthFirstMatch[3]));
    }
  }

  // 3. Named month middle: "12 May 2024" or "12-May-2024" or "12/May/2024"
  const namedMonthMatch = /^(\d{1,2})[\s/-]+([A-Za-z]{3,9})[\s/-]+(\d{2}|\d{4})$/.exec(text);
  if (namedMonthMatch !== null) {
    const month = MONTHS[namedMonthMatch[2]?.slice(0, 3).toLowerCase() ?? ""];
    if (month !== undefined) {
      const sourceYear = Number(namedMonthMatch[3]);
      const year = namedMonthMatch[3]?.length === 2 ? normalizeTwoDigitYear(sourceYear) : sourceYear;
      return resultFromParts(Number(namedMonthMatch[1]), month, year);
    }
  }

  // 4. ISO format: "2024-05-12" or "2024/05/12"
  const isoMatch = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  if (isoMatch !== null) {
    return resultFromParts(Number(isoMatch[3]), Number(isoMatch[2]), Number(isoMatch[1]));
  }

  return { value: null, error: "Date must use a supported India-first format." };
}
