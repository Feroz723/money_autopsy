import { StatementImportError } from "./errors.js";
import type { LocalStatementFile, SupportedFormat } from "./types.js";

const CSV_MIME_TYPES = new Set(["text/csv", "application/csv"]);
const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const PDF_MIME_TYPES = new Set(["application/pdf"]);

export function detectFormat(file: LocalStatementFile): SupportedFormat {
  const name = file.name.trim().toLowerCase();
  const mimeType = file.mimeType?.trim().toLowerCase();

  if (name.endsWith(".csv") || (mimeType !== undefined && CSV_MIME_TYPES.has(mimeType))) {
    return "CSV";
  }

  if (name.endsWith(".xlsx") || (mimeType !== undefined && XLSX_MIME_TYPES.has(mimeType))) {
    return "XLSX";
  }

  if (name.endsWith(".pdf") || (mimeType !== undefined && PDF_MIME_TYPES.has(mimeType))) {
    return "PDF";
  }

  throw new StatementImportError(
    "UNSUPPORTED_FILE",
    "Only CSV, XLSX, and PDF statement files are supported.",
  );
}
