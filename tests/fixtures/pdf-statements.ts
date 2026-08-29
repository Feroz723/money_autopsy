/**
 * Synthetic PDF statement fixtures.
 * Generates pure in-memory PDF 1.4 binary byte streams without file system or external tools.
 */

interface TextLine {
  text: string;
  x: number;
  y: number;
}

interface PageData {
  lines: TextLine[];
}

export function buildSyntheticPdf(pages: PageData[]): Uint8Array {
  const objects: string[] = [];

  // 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);

  // 2: Pages tree
  const pageObjNums: number[] = [];
  let nextObjNum = 3;

  for (let i = 0; i < pages.length; i += 1) {
    pageObjNums.push(nextObjNum);
    nextObjNum += 2; // Page obj + Contents obj
  }

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj`
  );

  // Font object (shared)
  const fontObjNum = nextObjNum;
  nextObjNum += 1;

  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i]!;
    const pNum = 3 + i * 2;
    const cNum = pNum + 1;

    // Build page stream content
    const ops = ["BT", "/F1 7.5 Tf"];
    for (const line of page.lines) {
      const escaped = line.text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      ops.push(`1 0 0 1 ${line.x} ${line.y} Tm (${escaped}) Tj`);
    }
    ops.push("ET");

    const streamContent = ops.join("\n");
    const streamLen = new TextEncoder().encode(streamContent).byteLength;

    // Page object
    objects.push(
      `${pNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${cNum} 0 R >>\nendobj`
    );

    // Contents stream object
    objects.push(`${cNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj`);
  }

  // Font definition
  objects.push(`${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  // Assemble full PDF
  let offset = 9; // "%PDF-1.4\n"
  const xrefEntries = ["0000000000 65535 f "];
  const bodyParts = ["%PDF-1.4\n"];

  for (const obj of objects) {
    xrefEntries.push(String(offset).padStart(10, "0") + " 00000 n ");
    bodyParts.push(obj + "\n");
    offset += new TextEncoder().encode(obj + "\n").byteLength;
  }

  const startxref = offset;
  const xref = `xref\n0 ${objects.length + 1}\n` + xrefEntries.join("\n") + "\n";
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  bodyParts.push(xref);
  bodyParts.push(trailer);

  return new TextEncoder().encode(bodyParts.join(""));
}

/** 1. Generic text-based PDF statement */
export function genericPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "STATEMENT OF ACCOUNT", x: 220, y: 740 },
        { text: "Account No: 1234567890", x: 50, y: 715 },
        { text: "Date", x: 50, y: 680 },
        { text: "Description", x: 130, y: 680 },
        { text: "Debit", x: 340, y: 680 },
        { text: "Credit", x: 420, y: 680 },
        { text: "Balance", x: 500, y: 680 },
        { text: "2026-04-01", x: 50, y: 655 },
        { text: "Salary Deposit", x: 130, y: 655 },
        { text: "", x: 340, y: 655 },
        { text: "50,000.00", x: 420, y: 655 },
        { text: "1,50,000.00", x: 500, y: 655 },
        { text: "2026-04-02", x: 50, y: 630 },
        { text: "Grocery Store", x: 130, y: 630 },
        { text: "1,234.50", x: 340, y: 630 },
        { text: "", x: 420, y: 630 },
        { text: "1,48,765.50", x: 500, y: 630 },
        { text: "2026-04-05", x: 50, y: 605 },
        { text: "Coffee Shop", x: 130, y: 605 },
        { text: "250.00", x: 340, y: 605 },
        { text: "", x: 420, y: 605 },
        { text: "1,48,515.50", x: 500, y: 605 },
        { text: "Closing Balance", x: 50, y: 580 },
        { text: "1,48,515.50", x: 500, y: 580 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 2. HDFC Bank styled PDF statement */
export function hdfcBankPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "HDFC BANK LIMITED", x: 230, y: 750 },
        { text: "Account Branch: KORAMANGALA", x: 40, y: 730 },
        { text: "Date", x: 40, y: 690 },
        { text: "Narration", x: 100, y: 690 },
        { text: "Chq./Ref.No.", x: 240, y: 690 },
        { text: "Value Dt", x: 315, y: 690 },
        { text: "Withdrawal Amt.", x: 375, y: 690 },
        { text: "Deposit Amt.", x: 460, y: 690 },
        { text: "Closing Balance", x: 535, y: 690 },
        { text: "01/04/24", x: 40, y: 665 },
        { text: "UPI-SWIGGY-swiggy@upi", x: 100, y: 665 },
        { text: "REF8001", x: 240, y: 665 },
        { text: "01/04/24", x: 315, y: 665 },
        { text: "450.00", x: 375, y: 665 },
        { text: "", x: 460, y: 665 },
        { text: "24,550.00", x: 535, y: 665 },
        { text: "02/04/24", x: 40, y: 640 },
        { text: "NEFT CR-SALARY-APR", x: 100, y: 640 },
        { text: "NEFT9001", x: 240, y: 640 },
        { text: "02/04/24", x: 315, y: 640 },
        { text: "", x: 375, y: 640 },
        { text: "1,00,000.00", x: 460, y: 640 },
        { text: "1,24,550.00", x: 535, y: 640 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 3. ICICI Bank Detailed Statement PDF */
export function iciciBankPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "ICICI Bank Detailed Statement", x: 200, y: 750 },
        { text: "Statement Period: 01-04-2024 to 30-04-2024", x: 15, y: 730 },
        { text: "S No.", x: 15, y: 690 },
        { text: "Value Date", x: 45, y: 690 },
        { text: "Transaction Date", x: 95, y: 690 },
        { text: "Cheque Number", x: 170, y: 690 },
        { text: "Transaction Remarks", x: 235, y: 690 },
        { text: "Withdrawal Amount (INR)", x: 350, y: 690 },
        { text: "Deposit Amount (INR)", x: 440, y: 690 },
        { text: "Balance (INR)", x: 525, y: 690 },
        { text: "1", x: 15, y: 665 },
        { text: "01/04/2024", x: 45, y: 665 },
        { text: "01/04/2024", x: 95, y: 665 },
        { text: "-", x: 170, y: 665 },
        { text: "UPI-Rent Payment", x: 235, y: 665 },
        { text: "15,000.00", x: 350, y: 665 },
        { text: "35,000.00", x: 525, y: 665 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 4. Multi-page PDF statement with repeated header */
export function multiPagePdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    // Page 1
    {
      lines: [
        { text: "ACCOUNT STATEMENT - PAGE 1", x: 220, y: 740 },
        { text: "Date", x: 50, y: 700 },
        { text: "Description", x: 140, y: 700 },
        { text: "Debit", x: 340, y: 700 },
        { text: "Credit", x: 420, y: 700 },
        { text: "Balance", x: 500, y: 700 },
        { text: "2026-04-01", x: 50, y: 670 },
        { text: "Initial Salary", x: 140, y: 670 },
        { text: "", x: 340, y: 670 },
        { text: "50,000.00", x: 420, y: 670 },
        { text: "50,000.00", x: 500, y: 670 },
        { text: "Page 1 of 2", x: 260, y: 50 },
      ],
    },
    // Page 2 (repeated header + continuing transactions)
    {
      lines: [
        { text: "ACCOUNT STATEMENT - PAGE 2", x: 220, y: 740 },
        { text: "Date", x: 50, y: 700 },
        { text: "Description", x: 140, y: 700 },
        { text: "Debit", x: 340, y: 700 },
        { text: "Credit", x: 420, y: 700 },
        { text: "Balance", x: 500, y: 700 },
        { text: "2026-04-02", x: 50, y: 670 },
        { text: "Supermarket Purchase", x: 140, y: 670 },
        { text: "2,000.00", x: 340, y: 670 },
        { text: "", x: 420, y: 670 },
        { text: "48,000.00", x: 500, y: 670 },
        { text: "Page 2 of 2", x: 260, y: 50 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 5. PDF with multi-line wrapped narration */
export function wrappedNarrationPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "Date", x: 50, y: 700 },
        { text: "Description", x: 140, y: 700 },
        { text: "Debit", x: 340, y: 700 },
        { text: "Credit", x: 420, y: 700 },
        { text: "Balance", x: 500, y: 700 },
        { text: "2026-04-01", x: 50, y: 670 },
        { text: "AMAZON RETAIL INDIA PVT LTD", x: 140, y: 670 },
        { text: "1,500.00", x: 340, y: 670 },
        { text: "", x: 420, y: 670 },
        { text: "10,000.00", x: 500, y: 670 },
        // Wrapped continuation line for description (no date, no amount)
        { text: "ORDER ID 402-1234567-8901234", x: 140, y: 655 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 6. PDF with corrupted reconciliation balance */
export function corruptedBalancePdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "Date", x: 50, y: 700 },
        { text: "Description", x: 140, y: 700 },
        { text: "Debit", x: 340, y: 700 },
        { text: "Credit", x: 420, y: 700 },
        { text: "Balance", x: 500, y: 700 },
        { text: "2026-04-01", x: 50, y: 670 },
        { text: "Initial Salary", x: 140, y: 670 },
        { text: "", x: 340, y: 670 },
        { text: "50,000.00", x: 420, y: 670 },
        { text: "50,000.00", x: 500, y: 670 },
        { text: "2026-04-02", x: 50, y: 645 },
        { text: "Purchase", x: 140, y: 645 },
        { text: "1,000.00", x: 340, y: 645 },
        { text: "", x: 420, y: 645 },
        // Corrupted balance: should be 49,000.00, but is 99,999.00
        { text: "99,999.00", x: 500, y: 645 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 7. Scanned / image-only PDF simulation (empty text) */
export function scannedEmptyPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [], // No text elements
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 8. Unsupported layout (text exists, but no transaction table) */
export function unsupportedLayoutPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "TERMS AND CONDITIONS", x: 200, y: 740 },
        { text: "This is an informational brochure with no transaction table.", x: 50, y: 700 },
        { text: "Please contact customer support for further details.", x: 50, y: 675 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}

/** 9. PhonePe / UPI statement PDF with single Amount column and Type column */
export function phonepeStatementPdfBytes(): ArrayBuffer {
  const pdf = buildSyntheticPdf([
    {
      lines: [
        { text: "PhonePe Transaction Statement", x: 200, y: 750 },
        { text: "Date", x: 40, y: 700 },
        { text: "Transaction Details", x: 180, y: 700 },
        { text: "Type", x: 340, y: 700 },
        { text: "Amount", x: 410, y: 700 },
        { text: "Transaction ID", x: 490, y: 700 },
        { text: "12 May 2024, 08:30 PM", x: 40, y: 665 },
        { text: "Paid to Swiggy", x: 180, y: 665 },
        { text: "DEBIT", x: 340, y: 665 },
        { text: "450.00", x: 410, y: 665 },
        { text: "T2405122030", x: 490, y: 665 },
        { text: "13 May 2024, 11:15 AM", x: 40, y: 635 },
        { text: "Received from Ramesh", x: 180, y: 635 },
        { text: "CREDIT", x: 340, y: 635 },
        { text: "2,500.00", x: 410, y: 635 },
        { text: "T2405131115", x: 490, y: 635 },
        { text: "14 May 2024, 04:00 PM", x: 40, y: 605 },
        { text: "Electricity Bill Paid", x: 180, y: 605 },
        { text: "DEBIT", x: 340, y: 605 },
        { text: "1,200.00", x: 410, y: 605 },
        { text: "T2405141600", x: 490, y: 605 },
      ],
    },
  ]);
  return pdf.buffer as ArrayBuffer;
}
