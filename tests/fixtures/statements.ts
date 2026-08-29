import { strToU8, zipSync } from "fflate";

import type { LocalStatementFile } from "../../src/ingestion/types.js";

export const genericCsv = `Date,Description,Debit,Credit,Balance
Opening Balance,,,,"1,00,000.00"
01/04/2026,Fictional Salary,,"50,000.00","1,50,000.00"
02/04/2026,Fictional Apartment Rent,"15,000.00",,"1,35,000.00"
03/04/2026,Fictional Groceries,"1,234.50",,"1,33,765.50"
Closing Balance,,,,"1,33,765.50"`;

export const indianStyleCsv = `Txn Date,Particulars,Withdrawal,Deposit,Balance
Opening Balance,,,,"2,00,000.00"
03-04-2026,Fictional Equipment,"1,23,456.00",,"76,544.00"
04-04-2026,Fictional Refund,,"1,000.00","77,544.00"
Closing Balance,,,,"77,544.00"`;

export const referenceAndDuplicatesCsv = `Transaction Date,Remarks,Debit Amount,Credit Amount,Running Balance,Transaction ID
Opening Balance,,,,"10,000.00",
01/04/2026,Fictional UPI Tea,250.00,,9750.00,FICTION-UPI-001
01/04/2026,Fictional UPI Tea,250.00,,9500.00,FICTION-UPI-001
02/04/2026,Fictional Cashback,,500.00,10000.00,FICTION-CASH-002
Closing Balance,,,,10000.00,`;

export const missingOptionalColumnsCsv = ` Value Date , Narration , Withdrawal Amt 
03/04/2026,Fictional One,100.00
04/04/2026,Fictional Two,200.00`;

export const invalidRowsCsv = `Date,Description,Debit,Credit,Balance
,,,,
Date,Description,Debit,Credit,Balance
not-a-date,Fictional Invalid Date,1.00,,99.00
03/04/2026,Fictional Missing Amount,,,100.00
04/04/2026,,,10.00,110.00
05/04/2026,Fictional Invalid Amount,"1,23,45",,110.00
This statement is generated for fictional testing,,,,
Closing Balance,,,,110.00
06/04/2026,Fictional Valid,,10.00,110.00`;

export const balanceFailureCsv = `Date,Description,Debit,Credit,Balance
Opening Balance,,,,1000.00
01/04/2026,Fictional Debit,100.00,,900.00
02/04/2026,Fictional Credit,,200.00,1000.00
Closing Balance,,,,1000.00`;

type FixtureCell = string | number | null;

interface FixtureSheet {
  name: string;
  rows: FixtureCell[][];
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number): string {
  let value = index + 1;
  let column = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }
  return column;
}

function worksheetXml(rows: FixtureCell[][]): string {
  const rowXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          if (value === null) {
            return "";
          }
          const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
          if (typeof value === "number") {
            return `<c r="${reference}"><v>${value}</v></c>`;
          }
          return `<c r="${reference}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;
}

function workbookBytes(sheets: FixtureSheet[]): ArrayBuffer {
  const sheetEntries = sheets.map((sheet, index) => ({
    name: `xl/worksheets/sheet${index + 1}.xml`,
    data: strToU8(worksheetXml(sheet.rows)),
  }));
  const sheetDeclarations = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("");
  const relationships = sheets
    .map(
      (_sheet, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join("");
  const contentTypes = sheets
    .map(
      (_sheet, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const archive = zipSync({
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${contentTypes}</Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetDeclarations}</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`,
    ),
    ...Object.fromEntries(sheetEntries.map((entry) => [entry.name, entry.data])),
  });
  return archive.buffer;
}

export function xlsxEquivalentBytes(): ArrayBuffer {
  return workbookBytes([
    {
      name: "Read me",
      rows: [["Fictional statement fixture"], ["This worksheet intentionally has no transaction table."]],
    },
    {
      name: "Transactions",
      rows: [
        ["Fictional Beta Bank Statement"],
        [],
        ["Txn Date", "Particulars", "Withdrawal", "Deposit", "Balance", "Ref No."],
        ["Opening Balance", null, null, null, "1,00,000.00", null],
        ["03 Apr 2026", "Fictional Salary", null, 50000, 150000, "FICTION-001"],
        ["04/04/2026", "Fictional Rent", 15000, null, 135000, "FICTION-002"],
        ["05-04-26", "Fictional Cashback", null, "₹1,234.50", 136234.5, "FICTION-003"],
        ["Txn Date", "Particulars", "Withdrawal", "Deposit", "Balance", "Ref No."],
        ["Closing Balance", null, null, null, 136234.5, null],
      ],
    },
  ]);
}

export function ambiguousXlsxBytes(): ArrayBuffer {
  const rows = [
    ["Date", "Description", "Debit", "Credit"],
    ["01/04/2026", "Fictional item", 100, null],
  ];
  return workbookBytes([
    { name: "Statement one", rows },
    { name: "Statement two", rows },
  ]);
}

export function csvFile(name: string, text: string): LocalStatementFile {
  return { name, bytes: new TextEncoder().encode(text).buffer };
}

export function xlsxFile(name = "fictional-statement.xlsx"): LocalStatementFile {
  return { name, bytes: xlsxEquivalentBytes() };
}
