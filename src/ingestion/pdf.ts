import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { StatementImportError } from "./errors.js";
import { findHeaderRow, hasLikelyTransactions } from "./headers.js";
import { normalizeDate } from "./date.js";
import { detectIciciDetailedTable } from "./profiles/icici-bank-detailed.js";
import type { CellValue, DetectedTable } from "./types.js";

// Set worker source for browser runtime
if (typeof window !== "undefined" && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface PositionedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LineCluster {
  y: number;
  items: { text: string; x: number; endX: number }[];
}

/**
 * Extracts and clusters positioned text items from a PDF page into horizontal lines.
 */
function clusterPageLines(items: PositionedTextItem[], yTolerance = 3.5, spaceGap = 2): LineCluster[] {
  // Sort items descending by Y (top of page first), then ascending by X (left to right)
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.y - a.y;
    return Math.abs(yDiff) <= yTolerance ? a.x - b.x : yDiff;
  });

  const lines: LineCluster[] = [];

  for (const item of sorted) {
    const text = item.str.trim();
    if (text === "") continue;

    // Find existing line within yTolerance
    let line = lines.find((l) => Math.abs(l.y - item.y) <= yTolerance);
    if (!line) {
      line = { y: item.y, items: [] };
      lines.push(line);
    }

    const lastItem = line.items[line.items.length - 1];
    // If the new item is adjacent/overlapping the last item on the same line, concatenate
    if (lastItem && item.x - lastItem.endX <= spaceGap) {
      lastItem.text += " " + text;
      lastItem.endX = Math.max(lastItem.endX, item.x + item.width);
    } else {
      line.items.push({
        text,
        x: item.x,
        endX: item.x + item.width,
      });
    }
  }

  // Ensure all line items are strictly sorted left-to-right by X
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }

  // Ensure lines are sorted top-to-bottom
  return lines.sort((a, b) => b.y - a.y);
}

/**
 * Converts line clusters into cell rows based on column X-anchor intervals.
 */
function projectLinesToTableRows(
  pageLines: LineCluster[],
  columnAnchors?: number[]
): CellValue[][] {
  const rows: CellValue[][] = [];

  if (!columnAnchors || columnAnchors.length === 0) {
    for (const line of pageLines) {
      if (line.items.length === 0) continue;
      rows.push(line.items.map((i) => i.text));
    }
    return rows;
  }

  // Calculate boundary split points midway between consecutive column anchors
  const boundaries: number[] = [];
  for (let i = 0; i < columnAnchors.length - 1; i += 1) {
    const cur = columnAnchors[i] ?? 0;
    const next = columnAnchors[i + 1] ?? 0;
    boundaries.push((cur + next) / 2);
  }

  for (const line of pageLines) {
    if (line.items.length === 0) continue;

    const rowCells: string[] = new Array(columnAnchors.length).fill("");

    for (const item of line.items) {
      let colIdx = 0;
      while (colIdx < boundaries.length && item.x >= (boundaries[colIdx] ?? Infinity)) {
        colIdx += 1;
      }

      if (rowCells[colIdx]) {
        rowCells[colIdx] += " " + item.text;
      } else {
        rowCells[colIdx] = item.text;
      }
    }

    rows.push(rowCells.map((c) => (c.trim() === "" ? null : c.trim())));
  }

  return rows;
}

/**
 * Extracts all pages and reconstructs statement transaction table from a PDF ArrayBuffer.
 */
export async function inspectPdf(bytes: ArrayBuffer): Promise<DetectedTable> {
  let doc;
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
    });
    doc = await loadingTask.promise;
  } catch (error: unknown) {
    const errString = String((error as { message?: string })?.message ?? error ?? "");
    const errName = String((error as { name?: string })?.name ?? "");
    if (
      errName === "PasswordException" ||
      errString.includes("PasswordException") ||
      errString.toLowerCase().includes("password")
    ) {
      throw new StatementImportError(
        "PDF_ENCRYPTED",
        "This PDF is password-protected and couldn't be read in the browser."
      );
    }
    const detail = (error as { message?: string })?.message ? ` (${(error as { message?: string }).message})` : "";
    throw new StatementImportError("PDF_READ_FAILED", `The PDF file could not be read safely${detail}.`);
  }

  if (doc.numPages === 0) {
    throw new StatementImportError(
      "PDF_NO_TEXT",
      "This appears to be a scanned or image-only PDF. OCR is not supported because your statement is processed locally."
    );
  }

  let totalTextLength = 0;
  const allPageLines: LineCluster[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: PositionedTextItem[] = [];
    for (const item of textContent.items) {
      if ("str" in item && typeof item.str === "string") {
        totalTextLength += item.str.trim().length;
        const transform = item.transform as number[];
        items.push({
          str: item.str,
          x: transform[4] ?? 0,
          y: transform[5] ?? 0,
          width: item.width ?? 0,
          height: item.height ?? 0,
        });
      }
    }

    const pageLines = clusterPageLines(items);
    allPageLines.push(...pageLines);
  }

  // Scanned or image-only PDF check
  if (totalTextLength < 20) {
    throw new StatementImportError(
      "PDF_NO_TEXT",
      "This appears to be a scanned or image-only PDF. OCR is not supported because your statement is processed locally."
    );
  }

  // First pass: extract rows as freeform token sequences to identify headers & column coordinates
  const initialRows = projectLinesToTableRows(allPageLines);

  // Try finding header row via generic or ICICI signature
  let detected = findHeaderRow(initialRows);
  if (!detected) {
    detected = detectIciciDetailedTable(initialRows);
  }

  if (!detected) {
    throw new StatementImportError(
      "NO_TRANSACTION_TABLE",
      "No transaction table with a date and debit or credit column was found."
    );
  }

  // Re-project table rows using detected header column X anchors
  const headerCluster = allPageLines[detected.headerRowIndex];
  let finalRows = initialRows;

  if (headerCluster && headerCluster.items.length >= 3) {
    const anchors = headerCluster.items.map((i) => i.x);
    finalRows = projectLinesToTableRows(allPageLines, anchors);
  }

  // Multi-line narration merging: if a line has no date but text in description column, join with previous row
  const mergedRows: CellValue[][] = [];
  for (let r = 0; r < finalRows.length; r += 1) {
    const row = finalRows[r] ?? [];
    if (r <= detected.headerRowIndex) {
      mergedRows.push(row);
      continue;
    }

    const dateVal = row[detected.headers.date];
    const parsedDate = normalizeDate(dateVal ?? null);
    const hasMoney =
      (detected.headers.debit !== undefined && row[detected.headers.debit] !== null) ||
      (detected.headers.credit !== undefined && row[detected.headers.credit] !== null) ||
      (detected.headers.balance !== undefined && row[detected.headers.balance] !== null);

    // If no valid date, no money values, and this row only has text, append to prior row description
    if (parsedDate.value === null && !hasMoney && mergedRows.length > detected.headerRowIndex + 1) {
      const prevRow = mergedRows[mergedRows.length - 1];
      const descIdx = detected.headers.description;
      if (prevRow && descIdx !== undefined) {
        const textInRow = row.filter((c) => c !== null && String(c).trim() !== "").join(" ");
        if (textInRow !== "") {
          prevRow[descIdx] = (prevRow[descIdx] ? prevRow[descIdx] + " " : "") + textInRow;
          continue;
        }
      }
    }

    mergedRows.push(row);
  }

  const finalTable: DetectedTable = {
    rows: mergedRows,
    headerRowIndex: detected.headerRowIndex,
    headers: detected.headers,
  };

  if (!hasLikelyTransactions(finalTable)) {
    throw new StatementImportError(
      "NO_TRANSACTION_TABLE",
      "No transaction table with a date and debit or credit column was found."
    );
  }

  return finalTable;
}
