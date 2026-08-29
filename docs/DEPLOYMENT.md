# Money Autopsy — Vercel Deployment Guide

This document outlines the deployment procedure, project configuration, and DNS requirements for deploying Money Autopsy to Vercel.

---

## 1. Project Overview & Architecture

- **Application Type**: Static client-side Single Page Application (SPA)
- **Framework**: Vite + Vanilla TypeScript / CSS
- **Backend / Database**: None (100% in-browser deterministic processing)
- **Environment Secrets**: **None** (Zero API keys, zero backend tokens, zero telemetry credentials)
- **Target URL**: `https://moneyautopsy.techpick.tech`

---

## 2. Vercel Project Configuration

When creating or importing the project in the Vercel Dashboard:

| Setting | Value | Notes |
|---|---|---|
| **Framework Preset** | `Vite` | Vercel automatically detects `vite` in `package.json` |
| **Root Directory** | `./` | Root of repository |
| **Build Command** | `npm run build` | Runs `tsc --noEmit && vite build` |
| **Output Directory** | `dist` | Generated static bundle containing `index.html` and assets |
| **Install Command** | `npm install` | Installs dependencies |
| **Node Version** | `20.x` or `22.x` | Standard Node LTS |

---

## 3. Environment Variables

**No environment variables are required.**
Because Money Autopsy performs all statement parsing, mathematical verification, and financial analysis locally in the user's browser, there are no remote services, APIs, or database credentials.

---

## 4. Custom Domain Setup (`moneyautopsy.techpick.tech`)

The parent domain `techpick.tech` is registered and managed separately.

### Required DNS Record

Add the following DNS record in your DNS provider (e.g. Cloudflare, Namecheap, Route 53):

| Type | Name / Host | Value / Target | TTL |
|---|---|---|---|
| **CNAME** | `moneyautopsy` | `cname.vercel-dns.com` | Automatic / 300 |

### Vercel Dashboard Domain Step
1. Go to your Vercel Project Settings $\rightarrow$ **Domains**.
2. Enter `moneyautopsy.techpick.tech` and click **Add**.
3. Vercel will automatically verify the CNAME record and provision an SSL certificate via Let's Encrypt.

---

## 5. Security & Privacy Headers (`vercel.json`)

The deployed `vercel.json` provides defense-in-depth protections:

- `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing.
- `X-Frame-Options: DENY` — Prevents clickjacking.
- `Referrer-Policy: strict-origin-when-cross-origin` — Protects referrer leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Disables unnecessary browser APIs.
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; connect-src 'none'; frame-ancestors 'none';` — **Enforces that no network connections (`connect-src 'none'`) can be initiated from the page.**

---

## 6. Pre-Flight Production Verification Checklist

Before publishing, verify:

- [x] Full test suite passes: `npm test` (155/155 tests passing)
- [x] Synthetic bank fixtures verified: `npm run verify:fixtures`
- [x] Strict TypeScript check passes: `npm run typecheck`
- [x] Linter passes with zero warnings: `npm run lint`
- [x] Production application bundle builds cleanly: `npm run build`
- [x] In-memory PDF parser (`pdfjs-dist`) is bundled locally with zero CDN worker dependencies
- [x] Zero financial data persistence in browser storage (`localStorage`, `sessionStorage`, `IndexedDB`)
- [x] Reset flow clears all loaded statement and analysis data immediately
