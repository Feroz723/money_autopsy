import type { MinorUnits } from "../ingestion/types.js";

function indianGrouping(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`;
}

/** Formats minor units as ₹ with Indian grouping: ₹1,23,456.00 */
export function formatIndianMoney(value: MinorUnits): string {
  const abs = value < 0n ? -value : value;
  const whole = (abs / 100n).toString();
  const fraction = (abs % 100n).toString().padStart(2, "0");
  return `${value < 0n ? "-" : ""}₹${indianGrouping(whole)}.${fraction}`;
}

/** Formats a percentage to 1 decimal place: 34.2% */
export function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}
