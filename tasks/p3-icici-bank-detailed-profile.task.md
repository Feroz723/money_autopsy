# Task: P3 — ICICI Bank Detailed Statement Profile

status: COMPLETE
type: feature
priority: high
source_identifier: icici-bank-detailed
depends_on: [P1, P2]

## Summary
Added the third ingestion adapter for the ICICI Bank Detailed Statement CSV/XLSX table. Profile detection is structural (header signature only), uses Transaction Date as canonical date, and maps the eight documented columns to the normalized model. Phase 1 and Phase 2 behavior is unchanged and regression-tested.

## Acceptance Criteria
- [x] Detects the eight-column ICICI Detailed Statement header (S No., Value Date, Transaction Date, Cheque Number, Transaction Remarks, Withdrawal Amount (INR), Deposit Amount (INR), Balance (INR)).
- [x] Returns source = "icici-bank-detailed".
- [x] Maps Transaction Date -> date (canonical), Cheque Number -> reference, Transaction Remarks -> description, Withdrawal -> debit, Deposit -> credit, Balance -> balance.
- [x] Value Date is a structural marker only, never used as the date.
- [x] S No. is ignored.
- [x] Handles DD/MM/YYYY, Indian comma grouping, "-" cheque/reference, same-day transactions, different Value/Transaction dates, long single-cell narrations.
- [x] Reconciliation verified on valid fixture; corrupted fixture marked unreliable.
- [x] False-positive fixture (filename "ICICI" but only generic columns) stays source "generic".
- [x] XLSX workbook variant detected and parsed.
- [x] No behavior change to generic or hdfc-bank profiles.

## Deliverables
- src/ingestion/types.ts: extended SourceIdentifier union.
- src/ingestion/profiles/icici-bank-detailed.ts: detectIciciDetailedTable().
- src/ingestion/profiles/detect.ts: ICICI detection checked first (structural, unambiguous).
- src/ingestion/ingest.ts: CSV fallback to ICICI detection when generic findHeaderRow returns null.
- src/ingestion/xlsx.ts: per-sheet generic + ICICI detection.
- tests/fixtures/icici-bank-detailed.ts: valid, corrupted-balance, false-positive CSV + XLSX builder.
- tests/icici-bank-detailed-profile.test.ts: 8 profile tests.
- tests/fixture-verification.test.ts: 5 ICICI fixtureChecks added.
- docs/profiles/icici-bank-detailed-statement-table.md: public evidence + spec.

## Validation
- npm run typecheck: PASS
- npm run lint: PASS
- npm test: 40 passed
- npm run verify:fixtures: 16 passed
- npm run build: PASS
- npm audit: 0 vulnerabilities

## Out of Scope
Other ICICI formats (simplified, current-account, credit-card), PDF, password handling, OCR, bank APIs.