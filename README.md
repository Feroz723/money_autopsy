# Money Autopsy

**Find out where your money actually went.**

Money Autopsy is a private, local-first application that examines bank and UPI statement exports and delivers a plain-English breakdown of your cash flows, spending surges, recurring payments, and unusual transactions.

---

## Key Principles

- **100% In-Browser & Local**: Your statement is parsed, normalized, verified, and analyzed entirely on your device using memory-only processing. Zero servers, zero databases, zero cloud storage, zero tracking, zero remote network calls.
- **Exact Integer Arithmetic**: All monetary amounts are computed using minor units (`bigint` paise/cents). No floating-point math inaccuracies.
- **Mathematical Balance Reconciliation**: Reconciles every balance transition in your statement to verify statement integrity.
- **Deterministic Intelligence**: Evidence-backed, rule-based financial analysis and findings engine with zero hallucinations.

---

## Supported File Formats

- **CSV** (Comma-separated values)
- **XLSX** (Microsoft Excel spreadsheets)
- **Text-based PDF** (Vector text statements with selectable transaction tables)

> **Notice**: Scanned or image-only PDFs requiring OCR are not supported yet, as all parsing is performed client-side in the browser. Encrypted/password-protected PDFs must be unlocked prior to analysis.

---

## Supported Statement Profiles

- **Generic Format**: Any standard bank/UPI statement containing recognizable Date, Description, Debit/Credit, and Balance columns.
- **HDFC Bank**: Structured 7-column statement layout.
- **ICICI Bank**: Detailed 8-column statement layout.

---

## Local Development & Validation Commands

```sh
# Run full unit and integration test suite
npm test

# Verify all synthetic test fixtures
npm run verify:fixtures

# Lint codebase
npm run lint

# Strict TypeScript typechecking
npm run typecheck

# Build TypeScript library
npm run build

# Build production client application bundle
npm run build:app

# Start local development server
npm run dev
```

---

## Privacy & Security Architecture

Money Autopsy operates under strict privacy constraints:
- No telemetry, analytics beacons, or remote logging.
- No persistence in `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
- Resetting the session clears all state and in-memory structures immediately.

