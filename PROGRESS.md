# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-26. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

> **Heads up — this tracker keeps drifting from what you see on `main`.** The scheduled task runs daily, but each run pushes to a fresh `claude/gifted-hopper-*` branch instead of `main`, and nothing has ever merged those back. There are 55+ such branches now (going back to 2026-07-20, the date `main` is still stuck on). Worse, because each run starts fresh from `main` rather than the prior day's branch, corrections get dropped and re-discovered instead of accumulating — e.g. the card-detail and collection-value-chart items below were independently verified as shipped on 2026-08-13, 08-18, 09-15, and 09-21, but every one of those corrections was lost because the next run restarted from stale `main`. This run's branch is `claude/gifted-hopper-yk59ka`. If you want this file current on `main`, either point the scheduled task at `main` directly (direct push or auto-PR) or periodically fast-forward the latest branch in.

## Status check — 2026-09-26
- **No commits landed on `card-scout` in the last 24 hours.** Newest commit on `main` is still `4891505` from 2026-07-20; last real code commit is `ff3caf3` from 2026-07-15 (73 days of no code activity).
- **`Investor-Dashboard` could not be checked** — this session's GitHub access is scoped to `card-scout` only. Same limitation every prior run has hit; this recap is card-scout only.
- Re-verified directly against the current code:
  - `artifacts/api-server/src/routes/storage.ts:139-152`: `GET /storage/objects/*` still has no auth/ACL check — scaffolded but commented out.
  - `artifacts/card-scout/src/pages/Dashboard.tsx:200` and `:205`: `YAxis` still gets `tickFormatter` passed twice — live duplicate-prop bug.
  - No `cost_basis`/`costBasis`, eBay OAuth/refresh-token flow, or sold-item archive logic anywhere in `artifacts/` — the three "In Progress" items below still have zero trace in this repo's git history.
  - No CSV import route anywhere (only CSV export) — confirming this yet again since the false "Confirmed Complete" claim keeps resurfacing on `main`.
  - `artifacts/card-scout/src/pages/CardTimeline.tsx` (per-card price-history `AreaChart` fed by `/api/collection/:id/timeline`) and `artifacts/card-scout/src/pages/Dashboard.tsx` (portfolio-value-over-time `AreaChart` fed by `portfolioSnapshotsTable`) are both fully live — moved to Confirmed Complete below, for real this time.
- `gitignore-security-fixes` branch (adds `.gitignore` exclusions for sql/dump/backup/env/credential files) has now been open **52 days** (since 2026-08-05), untouched. Still a 30-line, purely additive, low-risk merge.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail page with price-history chart — `CardTimeline.tsx`, live and wired to real data
- [x] Collection value over time (portfolio chart) — `Dashboard.tsx`, live and wired to `portfolioSnapshotsTable`

## Corrected (was wrongly marked done)
- [ ] ~~eBay CSV import built~~ — **false.** No CSV import route exists anywhere in `artifacts/`; only CSV *export* exists (Collection.tsx/Insurance.tsx). This line has been wrong on `main` since 2026-07-20 and keeps getting re-added by runs that rebuild from stale `main`.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — should only set once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric (`price_history.source` already distinguishes ebay vs. manual, so this metric is close to free once the overwrite guard lands)
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout (unverifiable from this session — Investor-Dashboard is out of GitHub scope)
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale, moves sold cards to an archive. No `isSold`/`soldAt` schema columns exist yet, so this can't start until that lands.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop fix (`Dashboard.tsx:200,205`)

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] **Migrate off eBay's legacy Finding API before it breaks** — `priceRefreshJob.ts` and `deals.ts` both call `svcs.ebay.com/.../FindingService`. eBay has been sunsetting this in favor of Browse API + Marketplace Insights; worth migrating proactively.
- [ ] Scaffold `isSold`/`soldAt`/`soldPrice` columns on `collection_items` now (default `isSold: false`) — unblocks sold-item sync incrementally even before eBay OAuth is ready
- [ ] Price refresh job silently marks failed/no-comp items as "checked" (`priceRefreshJob.ts` catch block) — a persistent eBay auth/rate-limit error looks identical to "no comps found." Add a distinct failure reason so real API breakage doesn't hide as normal noise.
- [ ] **Harden `/storage/objects/*`** — uncomment and wire up the ACL check in `storage.ts` (already scaffolded, just disabled)
- [ ] **Minimal CI** (typecheck + lint on push) — no CI in this repo yet; would catch things like the duplicate `tickFormatter` prop automatically
- [ ] **Reconcile Replit ↔ GitHub** — the "In Progress" items have been "just sent to Replit" since 2026-07-20 with zero corresponding commits here; worth checking whether that work exists uncommitted on Replit or was lost
- [ ] **Merge `gitignore-security-fixes`** — 52 days stale, purely additive, no reason it should still be sitting unmerged
- [ ] **Stop the branch sprawl** — repoint the scheduled task at `main` (direct push or auto-PR) instead of a fresh throwaway branch per run; 55+ dead branches have accumulated since July with zero net progress landing on `main`, and corrections keep getting rediscovered instead of accumulated
- [ ] **Give the scheduled task GitHub access to `Investor-Dashboard`** — every run so far has been unable to check its commit history at all due to repo-scope restriction
- [ ] **NEW:** `sets.ts` set-completion cost total is inconsistent with the portfolio snapshot's cost total — `routes/sets.ts:81` computes `totalCost` from `purchasePrice` only, while `priceRefreshJob.ts:138-147` computes the dashboard's `totalCost` from `purchasePrice + gradingFee + shippingFee + otherFees`. A set's "amount invested" understates true cost basis by omitting fees. Same fix as the cost-basis work should extend here.
- [ ] **NEW:** `priceRefreshJob.ts`'s `triggerUserRefreshIfStale(userId)` (lines 169–192) checks whether *one* user has stale items, but then calls `refreshStaleItems()` with no user filter (line 189) — which refreshes **every user's** stale collection items, not just that user's. A single user clicking a per-user "sync now"-style action would trigger eBay API calls and portfolio-snapshot writes for every other user on the system. Needs a `userId`-scoped code path before this is safe multi-user.
- [ ] **NEW:** `sessionsTable` rows are only deleted lazily, when `getSession()` happens to look up an already-expired sid (`lib/auth.ts:41-53`) — there's no periodic sweep of expired sessions the way `priceRefreshJob.ts` sweeps stale prices. Over time this is unbounded row growth with no cleanup path; worth a small scheduled job mirroring the existing price-refresh pattern.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
