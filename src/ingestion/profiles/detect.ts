import { detectHdfcBankTable } from "./hdfc-bank.js";
import { detectIciciDetailedTable } from "./icici-bank-detailed.js";
import type { DetectedTable, SourceIdentifier } from "../types.js";

export interface ProfileMatch {
  source: SourceIdentifier;
  table: DetectedTable;
}

/** Selects a profile only when its documented structural signature is complete. */
export function detectStatementProfile(table: DetectedTable): ProfileMatch {
  const iciciTable = detectIciciDetailedTable(table.rows);
  if (iciciTable !== null) {
    return { source: "icici-bank-detailed", table: iciciTable };
  }

  const hdfcTable = detectHdfcBankTable(table);
  if (hdfcTable !== null) {
    return { source: "hdfc-bank", table: hdfcTable };
  }

  return { source: "generic", table };
}
