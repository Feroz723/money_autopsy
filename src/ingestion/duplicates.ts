import type { NormalizedTransaction } from "./types.js";

function normalizedFingerprintText(value: string | null): string {
  return value === null ? "" : value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Counts additional rows in conservative duplicate groups; no transactions are removed. */
export function countPossibleDuplicates(transactions: NormalizedTransaction[]): number {
  const counts = new Map<string, number>();
  let possibleDuplicates = 0;

  for (const transaction of transactions) {
    const direction = transaction.debit === null ? "credit" : "debit";
    const amount = transaction.debit ?? transaction.credit;
    const fingerprint = [
      transaction.date,
      direction,
      amount?.toString() ?? "",
      normalizedFingerprintText(transaction.description),
      normalizedFingerprintText(transaction.reference),
    ].join("\u001f");
    const count = counts.get(fingerprint) ?? 0;
    if (count > 0) {
      possibleDuplicates += 1;
    }
    counts.set(fingerprint, count + 1);
  }

  return possibleDuplicates;
}
