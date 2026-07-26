# Legends & Lunatics — Progress Tracker

_Last updated: 2026-07-26. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_2026-07-26 check: no new commits on `card-scout` `main` in the last 24h — last code commit is still `ff3caf3` (2026-07-15). `Investor-Dashboard` still could not be checked — this session's GitHub access is scoped to `card-scout` only._

_**Process note (carried forward, still unresolved):** the daily checks from 07-21 through 07-25 each committed to their own throwaway branch (`claude/gifted-hopper-*`) instead of `main`, and no PR was ever opened for any of them (`list_pull_requests` on this repo returns zero, open or closed) — so `main` sat on the 07-20 version of this file for six days while real notes piled up on orphaned branches. This run again folds forward the useful bits and commits on its assigned branch. Worth deciding: should this task open a PR each day so the notes actually land on `main`, or should it just push straight to `main`? Either fixes this; right now neither is happening._

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] eBay CSV import built — auto-updates inventory + current value
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — checked the codebase directly: no `cost_basis` field exists anywhere in `artifacts/api-server` yet, so this hasn't been started in code (CSV re-imports were overwriting cost_basis; should only set once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric)
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix) — **still blocked**: verified `routes/deals.ts` and `lib/ebay.ts` both still call the legacy eBay Finding API (`svcs.ebay.com/.../FindingService`), not the Browse API. eBay has been deprecating Finding API — the migration hasn't happened, so this smoke test would be testing the wrong thing if run now.
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — `tickFormatter` is used 4x across `Dashboard.tsx` and `CardTimeline.tsx`; no fix commit found, still open.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Cross-link Wishlist and Deal Finder — auto-flag when a wishlist card shows up in Deal Finder results instead of relying on manual checking (both routes already exist: `wishlist.ts`, `deals.ts`)
- [ ] Surface a "prices last checked" timestamp in the UI, sourced from `priceRefreshJob.ts` — makes staleness visible instead of implying live data
- [ ] Card image caching/thumbnails via the existing `object-storage-web` lib, to speed up card detail and collection grid loads
- [ ] Wire `fetchEbayComps` (in `lib/ebay.ts` — already returns median/average price, sample size, and comp listings) into a card detail endpoint + page. This would close out both the "Card detail page" and "eBay sold vs. active price badges" items above without new backend work.
- [ ] Wire the existing `/portfolio/history` endpoint (`routes/portfolio.ts`, 90-day aggregated value/cost snapshots, backed by `portfolioSnapshotsTable`) into a dashboard chart to satisfy "Collection value over time" — backend's already there.
- [ ] **New:** Migrate `deals.ts` + `ebay.ts` off the legacy Finding API to the Browse API before it gets shut off — this is the same root cause blocking the Deal Finder quick win above, and eBay has been actively sunsetting Finding API, so it's a ticking time bomb rather than a nice-to-have.
- [ ] **New:** No automated tests exist anywhere in the repo (checked for `*.test.*`, `*.spec.*`, and CI workflows — none found). Given money math (cost basis, realized/estimated P/L) is the core value of this app, worth adding at least unit tests around the cost-basis and profit/loss calculations before building the Separate P/L tab, so a calculation bug doesn't silently misreport real money.
- [ ] **New:** No `.env`/secrets-handling files found in the repo — worth double-checking how the eBay App ID/Cert ID and any OAuth refresh tokens are stored/loaded in this environment (Replit secrets vs. committed config) before the "Real eBay OAuth" work lands, so refresh tokens don't end up in git history.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
