import type { CellValue, MinorUnits } from "./types.js";

export interface MoneyParseResult {
  value: MinorUnits | null;
  error?: string;
}

function hasValidGrouping(integerPart: string): boolean {
  if (!integerPart.includes(",")) {
    return /^\d+$/.test(integerPart);
  }

  const groups = integerPart.split(",");
  const first = groups[0] ?? "";
  const last = groups[groups.length - 1] ?? "";
  if (!/^\d{1,3}$/.test(first) || !/^\d{3}$/.test(last) || groups.some((group) => group === "")) {
    return false;
  }

  const middle = groups.slice(1, -1);
  const indianGrouping = middle.every((group) => /^\d{2}$/.test(group));
  const westernGrouping = groups.slice(1).every((group) => /^\d{3}$/.test(group));
  return indianGrouping || westernGrouping;
}

export function normalizeMoney(value: CellValue): MoneyParseResult {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return { value: null };
  }

  let text: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || /e/i.test(value.toString())) {
      return { value: null, error: "Numeric amount is outside the supported exact range." };
    }
    text = value.toString();
  } else if (typeof value === "string") {
    text = value.trim();
  } else {
    return { value: null, error: "Amount is not a number or currency string." };
  }

  let negative = false;
  if (text.startsWith("(") || text.endsWith(")")) {
    if (!text.startsWith("(") || !text.endsWith(")")) {
      return { value: null, error: "Parenthesized amount is malformed." };
    }
    negative = true;
    text = text.slice(1, -1);
  }

  text = text.trim().replace(/\s+/g, "").replace(/^(?:₹|inr|rs\.?)/i, "");
  if (text.startsWith("+") || text.startsWith("-")) {
    if (negative) {
      return { value: null, error: "Amount has conflicting negative notation." };
    }
    negative = text.startsWith("-");
    text = text.slice(1);
  }

  const amountMatch = /^(\d[\d,]*)(?:\.(\d{1,2}))?$/.exec(text);
  if (amountMatch === null || !hasValidGrouping(amountMatch[1] ?? "")) {
    return { value: null, error: "Amount has invalid currency formatting." };
  }

  const whole = (amountMatch[1] ?? "").replace(/,/g, "");
  const fraction = (amountMatch[2] ?? "").padEnd(2, "0");
  const minor = BigInt(`${whole}${fraction}`);
  return { value: negative ? -minor : minor };
}

export function formatMinorUnits(value: MinorUnits): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}
