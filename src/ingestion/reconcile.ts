import type {
  BalanceVerification,
  ExtractedBalanceMarkers,
  NormalizedTransaction,
  TransactionTotals,
} from "./types.js";

interface TransitionCheck {
  checked: number;
  failedRows: number[];
  orientation: "input" | "reverse";
}

function transactionDelta(transaction: NormalizedTransaction): bigint {
  return (transaction.credit ?? 0n) - (transaction.debit ?? 0n);
}

function checkInputOrder(transactions: NormalizedTransaction[], rowNumbers: number[]): TransitionCheck {
  let checked = 0;
  const failedRows: number[] = [];
  for (let index = 1; index < transactions.length; index += 1) {
    const previous = transactions[index - 1];
    const current = transactions[index];
    if (previous?.balance === null || current?.balance === null || previous === undefined || current === undefined) {
      continue;
    }
    checked += 1;
    if (previous.balance + transactionDelta(current) !== current.balance) {
      failedRows.push(rowNumbers[index] ?? index + 1);
    }
  }
  return { checked, failedRows, orientation: "input" };
}

function checkReverseOrder(transactions: NormalizedTransaction[], rowNumbers: number[]): TransitionCheck {
  let checked = 0;
  const failedRows: number[] = [];
  for (let index = 0; index < transactions.length - 1; index += 1) {
    const current = transactions[index];
    const older = transactions[index + 1];
    if (current?.balance === null || older?.balance === null || current === undefined || older === undefined) {
      continue;
    }
    checked += 1;
    if (older.balance + transactionDelta(current) !== current.balance) {
      failedRows.push(rowNumbers[index] ?? index + 1);
    }
  }
  return { checked, failedRows, orientation: "reverse" };
}

function determineStatementOrientation(
  transactions: NormalizedTransaction[],
): TransitionCheck["orientation"] {
  let nonDecreasing = true;
  let nonIncreasing = true;
  for (let index = 1; index < transactions.length; index += 1) {
    const previousDate = transactions[index - 1]?.date;
    const currentDate = transactions[index]?.date;
    if (previousDate === undefined || currentDate === undefined) {
      continue;
    }
    if (currentDate < previousDate) {
      nonDecreasing = false;
    }
    if (currentDate > previousDate) {
      nonIncreasing = false;
    }
  }

  // Equal dates retain source order; only a clearly descending statement is read in reverse.
  return nonIncreasing && !nonDecreasing ? "reverse" : "input";
}

function logicalOpeningBalance(
  transactions: NormalizedTransaction[],
  orientation: TransitionCheck["orientation"],
): bigint | null {
  const first = orientation === "input" ? transactions[0] : transactions[transactions.length - 1];
  if (first?.balance === null || first === undefined) {
    return null;
  }
  return first.balance - transactionDelta(first);
}

function logicalClosingBalance(
  transactions: NormalizedTransaction[],
  orientation: TransitionCheck["orientation"],
): bigint | null {
  const last = orientation === "input" ? transactions[transactions.length - 1] : transactions[0];
  return last?.balance ?? null;
}

function sumTransactionTotals(transactions: NormalizedTransaction[]): TransactionTotals {
  return transactions.reduce<TransactionTotals>(
    (totals, transaction) => ({
      debit: totals.debit + (transaction.debit ?? 0n),
      credit: totals.credit + (transaction.credit ?? 0n),
    }),
    { debit: 0n, credit: 0n },
  );
}

function checkTotals(
  transactions: NormalizedTransaction[],
  totals: TransactionTotals,
  markers: ExtractedBalanceMarkers,
  orientation: TransitionCheck["orientation"],
): { status: BalanceVerification["totalCheck"]; failedRow: number | null } {
  const opening = markers.opening?.value ?? logicalOpeningBalance(transactions, orientation);
  const closing = markers.closing?.value ?? logicalClosingBalance(transactions, orientation);
  if (opening === null || closing === null) {
    return { status: "unavailable", failedRow: null };
  }
  const expectedClosing = opening + totals.credit - totals.debit;
  if (expectedClosing === closing) {
    return { status: "verified", failedRow: null };
  }
  return { status: "failed", failedRow: markers.closing?.row ?? null };
}

/** Reconciles available balance values exactly, supporting statements printed in either order. */
export function reconcileBalances(
  transactions: NormalizedTransaction[],
  rowNumbers: number[],
  hasBalanceColumn: boolean,
  markers: ExtractedBalanceMarkers,
): BalanceVerification {
  if (!hasBalanceColumn) {
    return {
      status: "unavailable",
      message: "Balance verification is unavailable because the source has no balance column.",
      transitionsChecked: 0,
      totalCheck: "unavailable",
    };
  }

  const orientation = determineStatementOrientation(transactions);
  const transitions =
    orientation === "reverse"
      ? checkReverseOrder(transactions, rowNumbers)
      : checkInputOrder(transactions, rowNumbers);
  const totals = sumTransactionTotals(transactions);
  const totalCheck = checkTotals(transactions, totals, markers, transitions.orientation);
  const failedRow = transitions.failedRows[0] ?? totalCheck.failedRow;

  if (failedRow !== null && failedRow !== undefined) {
    return {
      status: "unreliable",
      message: `Transaction balance reconciliation failed around row ${failedRow}.`,
      transitionsChecked: transitions.checked,
      totalCheck: totalCheck.status,
    };
  }
  if (transitions.checked === 0 && totalCheck.status === "unavailable") {
    return {
      status: "unavailable",
      message: "Balance verification is unavailable because there are not enough usable balance values.",
      transitionsChecked: 0,
      totalCheck: "unavailable",
    };
  }

  return {
    status: "verified",
    message: "Balance continuity reconciled using exact minor-unit arithmetic.",
    transitionsChecked: transitions.checked,
    totalCheck: totalCheck.status,
  };
}

export function calculateTotals(transactions: NormalizedTransaction[]): TransactionTotals {
  return sumTransactionTotals(transactions);
}
