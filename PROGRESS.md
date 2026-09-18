# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-18. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## Session Note (2026-09-18)
- **card-scout: no commits since 2026-07-20** (this file's own commit is still the tip of the branch) — ~2 months dormant, nothing in the last 24h.
- **Investor-Dashboard: could not check.** This session's GitHub access is scoped to `dallaslopez09-commits/card-scout` only; `Investor-Dashboard` returned "access denied — not configured for this session." If you want the daily check to cover it, that repo needs to be added to this session's allowed list.
- Spot-checked the pending items below directly against the current code (not just commit log) since nothing new landed — all four "In Progress" items are still genuinely unimplemented, not just unrecorded. See notes inline.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] eBay CSV import built — auto-updates inventory + current value
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — CSV re-imports were overwriting cost_basis; should only set once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric. *Confirmed still pending: `collection_items` (lib/db/src/schema/portfolio.ts) has no confirmed/estimated cost distinction, and card-scout has CSV export only (Collection.tsx) — no CSV import path exists here yet, so this fix has nothing to attach to in this repo.*
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout. *Confirmed still pending: card-scout's eBay integration (api-server/src/lib/ebay.ts) is App ID/key-based Finding API for sold comps only; the only OAuth code in the repo is Replit's own OIDC user login (routes/auth.ts), unrelated to eBay.*
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. *Confirmed still pending: no sold/archived/soldDate field anywhere in the collection schema.*
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — *confirmed still present*: `artifacts/card-scout/src/pages/Dashboard.tsx` YAxis has two `tickFormatter` props (lines ~200 and ~205), second silently wins.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily

## New Ideas (from 2026-09-18 code read)
- [ ] **Fix the Dashboard duplicate `tickFormatter` now** — it's a real 2-minute bug (JSX duplicate prop, last one wins), not just a build warning, and it's independent of everything else on this list. No reason it's still sitting in Quick Wins two months later.
- [ ] **Give cost-basis fields a real home before building the fix logic** — right now `collection_items` only has a single `purchasePrice` plus fee columns; add explicit `costBasisConfirmed: boolean` / `costBasisSource: 'manual' | 'csv_import' | 'unestimated'` columns so the "Confirmed vs. Estimated" split in the backlog item has somewhere to write to, rather than overloading `purchasePrice` later.
- [ ] **Port the CSV import from Investor-Dashboard, not just the OAuth flow** — card-scout currently only has CSV *export* (Collection.tsx `handleExportCsv`). PROGRESS.md's "eBay CSV import" complete item appears to live entirely in Investor-Dashboard; if the two apps are meant to converge, import is the more useful of the two to bring over first since it's what the cost-basis bug (item above) actually happens on re-import.
