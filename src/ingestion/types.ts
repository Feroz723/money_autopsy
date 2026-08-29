export type MinorUnits = bigint;

export type SupportedFormat = "CSV" | "XLSX" | "PDF";
export type SourceIdentifier = "generic" | "hdfc-bank" | "icici-bank-detailed";
export type BalanceVerificationStatus = "verified" | "unreliable" | "unavailable";
export type TotalCheckStatus = "verified" | "failed" | "unavailable";

export type CellValue = string | number | Date | null;

export interface LocalStatementFile {
  name: string;
  bytes: ArrayBuffer;
  mimeType?: string;
}

export interface BrowserStatementFile {
  name: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface NormalizedTransaction {
  date: string;
  description: string | null;
  debit: MinorUnits | null;
  credit: MinorUnits | null;
  balance: MinorUnits | null;
  reference: string | null;
  source: SourceIdentifier;
}

export interface RejectedRowDiagnostic {
  row: number;
  reason: string;
}

export interface BalanceVerification {
  status: BalanceVerificationStatus;
  message: string;
  transitionsChecked: number;
  totalCheck: TotalCheckStatus;
}

export interface ImportDiagnostics {
  totalRowsInspected: number;
  transactionsAccepted: number;
  rowsIgnored: number;
  rowsRejected: number;
  rejectedRows: RejectedRowDiagnostic[];
  ignoredRowReasons: Record<string, number>;
  possibleDuplicates: number;
  balanceVerification: BalanceVerification;
}

export interface TransactionTotals {
  debit: MinorUnits;
  credit: MinorUnits;
}

export interface ImportResult {
  format: SupportedFormat;
  source: SourceIdentifier;
  transactions: NormalizedTransaction[];
  totals: TransactionTotals;
  diagnostics: ImportDiagnostics;
  reliable: boolean;
}

export interface HeaderMapping {
  date: number;
  description?: number;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: number;
  balance?: number;
  reference?: number;
}

export interface DetectedTable {
  rows: CellValue[][];
  headerRowIndex: number;
  headers: HeaderMapping;
}

export interface BalanceMarker {
  value: MinorUnits;
  row: number;
}

export interface ExtractedBalanceMarkers {
  opening: BalanceMarker | null;
  closing: BalanceMarker | null;
}

export interface NormalizedTableResult {
  transactions: NormalizedTransaction[];
  transactionRowNumbers: number[];
  totalRowsInspected: number;
  rowsIgnored: number;
  rowsRejected: number;
  rejectedRows: RejectedRowDiagnostic[];
  ignoredRowReasons: Record<string, number>;
  balanceMarkers: ExtractedBalanceMarkers;
}
