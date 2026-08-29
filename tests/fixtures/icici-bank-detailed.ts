import { strToU8, zipSync } from "fflate";

import type { LocalStatementFile } from "../../src/ingestion/types.js";

export const iciciDetailedCsv = `ICICI BANK LIMITED
Fictional Detailed Statement

S No.,Value Date,Transaction Date,Cheque Number,Transaction Remarks,Withdrawal Amount (INR),Deposit Amount (INR),Balance (INR)

,01/04/2024,,,Opening Balance,,,"50,000.00"
1,01/04/2024,01/04/2024,FICT-REF-001,"UPI-FICTIONAL MERCHANT-fixture@upi-ICIC0000000-600000000001-COFFEE","1,500.00",,"48,500.00"
2,02/04/2024,02/04/2024,-,"NEFT CR-FICTIONAL SALARY-APRIL 2024",,"1,00,000.00","1,48,500.00"
3,02/04/2024,02/04/2024,FICT-REF-003,"UPI-FICTIONAL GROCERY STORE-fixture@upi-ICIC0000000-600000000003-WEEKLY","1,200.50",,"1,47,299.50"
4,05/04/2024,03/04/2024,FICT-REF-004,"IMPS CR-FICTIONAL REFUND-ORDER 987654",,"5,000.00","1,52,299.50"
5,05/04/2024,03/04/2024,-,"UPI-FICTIONAL CASHBACK fixturerwards",,"250.00","1,52,549.50"
,05/04/2024,,,Closing Balance,,,"1,52,549.50"`;

export const iciciDetailedCorruptedBalanceCsv = `S No.,Value Date,Transaction Date,Cheque Number,Transaction Remarks,Withdrawal Amount (INR),Deposit Amount (INR),Balance (INR)
,01/04/2024,,,Opening Balance,,,"1,00,000.00"
1,01/04/2024,01/04/2024,-,UPI-FICTIONAL TEST-DEBIT,"500.00",,"99,500.00"
2,02/04/2024,02/04/2024,-,NEFT CR-FICTIONAL CREDIT,,1000.00,"99,999.00"
,02/04/2024,,,Closing Balance,,,"99,999.00"`;

export const iciciFalsePositiveCsv = `Date,Narration,ICICI Reference,Withdrawal,Deposit,Balance
01/04/2024,Fictional generic description,ICICI-REF-001,100.00,,900.00`;

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

export function iciciXlsxBytes(): ArrayBuffer {
  return workbookBytes([
    {
      name: "Detailed Statement",
      rows: [
        ["ICICI BANK LIMITED"],
        ["Fictional Detailed Statement"],
        [],
        [
          "S No.",
          "Value Date",
          "Transaction Date",
          "Cheque Number",
          "Transaction Remarks",
          "Withdrawal Amount (INR)",
          "Deposit Amount (INR)",
          "Balance (INR)",
        ],
        [null, "01/04/2024", null, null, "Opening Balance", null, null, "50,000.00"],
        [
          "1",
          "01/04/2024",
          "01/04/2024",
          "XLSX-REF-001",
          "UPI-FICTIONAL XLSX-TEST-fixture@upi-ICIC0000000",
          "1,500.00",
          null,
          "48,500.00",
        ],
        [
          "2",
          "02/04/2024",
          "02/04/2024",
          "-",
          "NEFT CR-FICTIONAL XLSX SALARY",
          null,
          "1,00,000.00",
          "1,48,500.00",
        ],
        [null, "02/04/2024", null, null, "Closing Balance", null, null, "1,48,500.00"],
      ],
    },
  ]);
}

export function iciciXlsxFile(name = "icici-detailed-statement.xlsx"): LocalStatementFile {
  return { name, bytes: iciciXlsxBytes() };
}