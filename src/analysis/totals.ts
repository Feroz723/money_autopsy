import type { NormalizedTransaction } from "../ingestion/types.js";
import type { CashFlowTotals } from "./types.js";

export function calculateCashFlow(transactions: NormalizedTransaction[]): CashFlowTotals {
  let income = 0n;
  let spending = 0n;
  let incomeCount = 0;
  let spendingCount = 0;

  for (const t of transactions) {
    if (t.credit !== null) {
      income += t.credit;
      incomeCount += 1;
    }
    if (t.debit !== null) {
      spending += t.debit;
      spendingCount += 1;
    }
  }

  return {
    income,
    spending,
    net: income - spending,
    transactionCount: transactions.length,
    incomeCount,
    spendingCount,
  };
}
