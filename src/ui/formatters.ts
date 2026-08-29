import type { NormalizedTransaction } from "../ingestion/types.js";
import { formatIndianMoney, formatPercent } from "../autopsy/format.js";

export { formatIndianMoney, formatPercent };

/** Formats an ISO date (YYYY-MM-DD) into readable Indian/international format: "01 Apr 2026" */
export function formatDisplayDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIdx = parseInt(m ?? "1", 10) - 1;
  const monthName = months[monthIdx] ?? m;
  return `${d} ${monthName} ${y}`;
}

/** Computes the date span from a transaction list: "01 Jan 2026 – 30 Apr 2026" */
export function formatDateRange(transactions: NormalizedTransaction[]): string {
  if (transactions.length === 0) return "No dates recorded";
  const dates = transactions.map((t) => t.date).filter(Boolean).sort();
  if (dates.length === 0) return "No dates recorded";
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  if (first === last) return formatDisplayDate(first);
  return `${formatDisplayDate(first)} – ${formatDisplayDate(last)}`;
}

/** Safe HTML string escaping */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
