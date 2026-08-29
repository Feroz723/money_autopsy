import type { NormalizedTransaction } from "../ingestion/types.js";
import type { TransferClassification } from "./types.js";

/**
 * Conservative transfer classification from a single account statement.
 *
 * LIMITATION: With only one statement, inter-account transfers cannot be
 * identified perfectly. This provides keyword-based hints only.
 */

const LIKELY_PATTERNS = ["self transfer", "own account", "trf to self", "trf from self", "internal transfer"];
const POSSIBLE_PATTERNS = ["fund transfer", "a/c transfer", "account transfer"];

export function classifyTransfers(transactions: NormalizedTransaction[]): TransferClassification[] {
  const results: TransferClassification[] = [];

  for (let i = 0; i < transactions.length; i += 1) {
    const text = (transactions[i]!.description ?? "").toLowerCase();
    if (text === "") continue;

    const likely = LIKELY_PATTERNS.find((p) => text.includes(p));
    if (likely !== undefined) {
      results.push({ transactionIndex: i, likelihood: "likely", reason: `matched '${likely}'` });
      continue;
    }

    const possible = POSSIBLE_PATTERNS.find((p) => text.includes(p));
    if (possible !== undefined) {
      results.push({ transactionIndex: i, likelihood: "possible", reason: `matched '${possible}'` });
    }
  }

  return results;
}
