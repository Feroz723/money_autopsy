# HDFC Bank Statement Table Profile

## Scope

This profile identifies the structured HDFC Bank savings/current account statement table when it is present in a CSV or XLSX input. It does not parse PDFs and does not identify a file from its filename.

## Public Layout Evidence

The profile is based on two public, non-account-specific descriptions of the HDFC statement layout:

- https://statementsift.com/banks/hdfc-bank
- https://sheetmybank.com/convert/hdfc

Both describe the same transaction columns: `Date`, `Narration`, `Chq./Ref.No.`, `Value Dt`, `Withdrawal Amt.`, `Deposit Amt.`, and `Closing Balance`. They document DD/MM/YY dates, Indian comma grouping, separate withdrawal/deposit columns, per-row closing balances, opening/closing balances, page-break continuation rows, and potentially truncated long UPI narration. The second source also describes HDFC's historical Excel and Text statement downloads.

These sources document the table layout, not a private customer statement. This repository contains no real statement data.

## Detection Rule

All seven normalized header labels must appear in the selected table header. The `Chq./Ref.No.` and `Value Dt` markers distinguish this profile from the generic parser. A bank name in the filename, metadata, narration, or account details has no effect on detection.

The public references do not specify a fixed metadata row count, blank-row policy, or footer text for the structured export. The adapter therefore makes no claim about any of those details: it scans the parsed table for the signature and lets the existing generic validator handle non-transaction rows. The fixtures use leading title rows only to verify this placement-independent behavior.

## Mapping

| HDFC table column | Normalized field |
| --- | --- |
| Date | `date` |
| Narration | `description` |
| Chq./Ref.No. | `reference` |
| Value Dt | not retained |
| Withdrawal Amt. | `debit` |
| Deposit Amt. | `credit` |
| Closing Balance | `balance` |

The existing exact money/date normalization, row validation, duplicate detection, and balance reconciliation remain responsible for all non-profile-specific behavior.
