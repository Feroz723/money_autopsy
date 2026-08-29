export type ImportErrorCode =
  | "UNSUPPORTED_FILE"
  | "MALFORMED_CSV"
  | "INVALID_XLSX"
  | "NO_TRANSACTION_TABLE"
  | "AMBIGUOUS_WORKSHEET"
  | "PDF_READ_FAILED"
  | "PDF_ENCRYPTED"
  | "PDF_NO_TEXT"
  | "PDF_UNSUPPORTED_LAYOUT";

/** An import error intentionally contains no uploaded statement values. */
export class StatementImportError extends Error {
  readonly code: ImportErrorCode;

  constructor(code: ImportErrorCode, message: string) {
    super(message);
    this.name = "StatementImportError";
    this.code = code;
  }
}
