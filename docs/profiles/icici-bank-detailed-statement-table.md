# ICICI Bank Detailed Statement Profile

## Scope

This profile identifies the **ICICI Bank Detailed Statement** structured table — the specific layout with S No., Value Date, Transaction Date, Cheque Number, Transaction Remarks, Withdrawal Amount (INR), Deposit Amount (INR), and Balance (INR). It does not apply to any other ICICI export format (simplified, current-account, credit-card, or PDF).

No filename, account number, or narration text is used for identification.

## Public evidence

The profile targets the eight-column "ICICI Bank Detailed Statement" layout documented by multiple third-party tooling sites (statementsift.com, sheetmybank.com). These sources describe the same columns and note that ICICI provides CSV and XLSX exports with this structure.

These sources document the table layout, not a private customer statement. This repository contains no real statement data.

## Detection rule

All eight normalized header labels must appear contiguously in a single row, in order. The `Value Date` column (position 1) is a structural marker — it must be present for detection but is not retained in the normalized output.

## Date handling

The statement contains both **Value Date** and **Transaction Date**. The profile uses **Transaction Date** (column 2) as the canonical `date` field.

If Transaction Date is missing for a row but Value Date exists, the row is rejected. This is intentional: silently substituting Value Date would hide a mismatch that matters for financial reconciliation.

## Column mapping

| ICICI detailed column | Normalized field |
|---|---|
| S No. | not retained (structural marker) |
| Value Date | not retained (structural marker) |
| Transaction Date | `date` |
| Cheque Number | `reference` |
| Transaction Remarks | `description` |
| Withdrawal Amount (INR) | `debit` |
| Deposit Amount (INR) | `credit` |
| Balance (INR) | `balance` |

## Known limitations

- Only the detailed eight-column layout is supported. ICICI's simplified statement export, current-account formats, credit-card statements, and legacy formats are out of scope.
- PDF versions of the detailed statement are not supported.
- The `S No.` column is validated for presence in the header but not for sequential numbering of data rows.
- If the `Value Date` and `Transaction Date` differ, only `Transaction Date` is preserved. A future phase that needs both dates would require a schema extension.