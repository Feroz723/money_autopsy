import { StatementImportError } from "./errors.js";
import type { CellValue } from "./types.js";

/** Parses RFC 4180-style quoted CSV without relying on column positions. */
export function parseCsv(text: string): CellValue[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] ?? "";

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }

  if (quoted) {
    throw new StatementImportError("MALFORMED_CSV", "The CSV file has an unterminated quoted value.");
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.map((values) => values.map((value) => value.replace(/^\uFEFF/, "")));
}
