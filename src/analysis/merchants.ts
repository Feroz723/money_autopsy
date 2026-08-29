import type { NormalizedTransaction } from "../ingestion/types.js";
import type { MerchantSummary } from "./types.js";

const KNOWN_PREFIXES = /^(?:upi[-/]|neft\s*(?:cr[-\s])?|imps\s*(?:cr[-\s])?|rtgs[-\s]|nach[-\s])/i;
const UPI_HANDLE = /[-\s][\w.]+@[\w]+.*$/;
const TRAILING_REFS = /[-\s]\d{12,}.*$/;
const BANK_CODES = /[-\s][A-Z]{4}\d{7,}.*$/;
const NOISE_SUFFIX = /[-\s]+$/;

export function extractMerchant(description: string | null): string {
  if (description === null || description.trim() === "") return "unknown";

  let key = description.toLowerCase().replace(/\s+/g, " ").trim();
  key = key.replace(KNOWN_PREFIXES, "");
  key = key.replace(UPI_HANDLE, "");
  key = key.replace(TRAILING_REFS, "");
  key = key.replace(BANK_CODES, "");
  key = key.replace(NOISE_SUFFIX, "").trim();

  return key === "" ? "unknown" : key;
}

export function groupByMerchant(transactions: NormalizedTransaction[]): MerchantSummary[] {
  const groups = new Map<string, { total: bigint; count: number; largest: bigint }>();

  for (const t of transactions) {
    if (t.debit === null) continue;
    const merchant = extractMerchant(t.description);
    const group = groups.get(merchant) ?? { total: 0n, count: 0, largest: 0n };
    group.total += t.debit;
    group.count += 1;
    if (t.debit > group.largest) group.largest = t.debit;
    groups.set(merchant, group);
  }

  return [...groups.entries()]
    .map(([merchant, g]) => ({
      merchant,
      totalSpending: g.total,
      transactionCount: g.count,
      averageAmount: g.count > 0 ? g.total / BigInt(g.count) : 0n,
      largestAmount: g.largest,
    }))
    .sort((a, b) => (b.totalSpending > a.totalSpending ? 1 : b.totalSpending < a.totalSpending ? -1 : 0));
}

export function topSpendingMerchants(merchants: MerchantSummary[], limit = 10): MerchantSummary[] {
  return merchants.slice(0, limit);
}
