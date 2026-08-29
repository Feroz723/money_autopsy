/**
 * UI Configuration Constants
 */

/** Maximum allowed statement file size in bytes (20 MB). */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "20 MB";

/** Supported file extensions. */
export const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".pdf"] as const;

/** Friendly display names for detected statement profiles. */
export const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  "hdfc-bank": "HDFC Bank Statement",
  "icici-bank-detailed": "ICICI Bank Detailed Statement",
  generic: "Generic Statement (CSV/XLSX)",
};

export function getSourceDisplayName(source: string): string {
  return SOURCE_DISPLAY_NAMES[source] ?? "Generic Statement";
}
