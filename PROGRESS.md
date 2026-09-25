# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-25. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

> **Heads up — this tracker keeps drifting from what you see on `main`.** The scheduled task runs daily, but each run pushes to a fresh `claude/gifted-hopper-*` branch instead of `main`, and nothing has ever merged those back. There are 55+ such branches sitting in the repo now (going back to 2026-07-20, the date `main` is still stuck on), several containing a more current PROGRESS.md than the one actually on `main`. Worse, because each run starts fresh from `main` rather than the prior day's branch, findings from earlier runs (e.g. 2026-09-23) get dropped and re-discovered instead of accumulating. If you want this file current on `main`, either point the scheduled task at `main` directly (direct push or auto-PR) or periodically fast-forward the latest branch in — this run's branch is `claude/gifted-hopper-qkci3i`.

## Status check — 2026-09-25
- **No commits landed on `card-scout` in the last 24 hours.** Newest commit on `main` is still `4891505` from 2026-07-20 (adding this file). Nothing below moves to "Confirmed Complete" this run.
- **`Investor-Dashboard` could not be checked** — this session's GitHub access is scoped to `card-scout` only. Same limitation every prior run has hit; recap below is card-scout only.
- Re-verified directly against the current code, all still hold:
  - `artifacts/api-server/src/routes/storage.ts:139-152`: `GET /storage/objects/*` still has no auth/ACL check — scaffolded but commented out. Any unauthenticated reader can fetch any object by path.
  - `artifacts/card-scout/src/pages/Dashboard.tsx:200` and `:205`: `YAxis` still gets `tickFormatter` passed twice — live duplicate-prop bug (React warns, second one silently wins).
  - No `cost_basis`/`costBasis`, eBay OAuth/refresh-token flow, or sold-item archive logic anywhere in `artifacts/` — the three "In Progress / Just Sent to Replit" items below still have zero trace in this repo's git history.
  - `artifacts/mockup-sandbox` still untouched since the initial commit (2026-07-08).
- `gitignore-security-fixes` branch (adds `.gitignore` exclusions for sql/dump/backup/env/credential files) has now been open **51 days** (since 2026-08-05) with no activity. 30-line, purely additive diff against `main` — no tracked secret files currently on `main`, so it's preventive, not urgent, but still low-risk to merge.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] eBay CSV import built — auto-updates inventory + current value
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — CSV re-imports were overwriting cost_basis; should only set once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] **Migrate off eBay's legacy Finding API before it breaks** — `priceRefreshJob.ts` and `deals.ts` both call `svcs.ebay.com/.../FindingService` (`findCompletedItems` / `findItemsAdvanced`). eBay has been sunsetting this API in favor of Browse API + Marketplace Insights (needs its own approval for sold-comps access); worth migrating proactively rather than discovering it's been silently returning empty results
- [ ] Scaffold `isSold` / `soldAt` / `soldPrice` columns on `collection_items` now — schema has no sold-state fields yet, so "Sold-item sync" can't start until this lands. Adding it now (default `isSold: false`) unblocks that work incrementally even before eBay OAuth is ready
- [ ] Price refresh job silently marks failed/no-comp items as "checked" (`priceRefreshJob.ts` catch block) — a persistent eBay auth/rate-limit error looks identical to "no comps found" in the data. Add a distinct failure reason/log surface so real API breakage doesn't hide as normal "no comps" noise
- [ ] **Harden `/storage/objects/*`** — uncomment and wire up the ACL check in `storage.ts` (already scaffolded, just disabled) so object entities aren't unauthenticated-readable by path
- [ ] **Minimal CI** (typecheck + lint on push) — no CI in this repo yet; would catch things like the duplicate `tickFormatter` prop automatically instead of relying on manual/scheduled review
- [ ] **Reconcile Replit ↔ GitHub** — the "In Progress" items (cost basis, eBay OAuth, sold-sync) have been marked "just sent to Replit" since 2026-07-20 with zero corresponding commits here; worth checking whether that work exists uncommitted on Replit or was lost, before re-doing it
- [ ] **Merge `gitignore-security-fixes`** — 51 days stale, purely additive `.gitignore` change, no reason it should still be sitting unmerged
- [ ] **Stop the branch sprawl** — repoint the scheduled task at `main` (direct push or auto-PR) instead of a fresh throwaway branch per run; 55+ dead `claude/gifted-hopper-*` branches have accumulated since July with zero net progress landing on `main`, and daily findings are being re-discovered instead of accumulated
- [ ] **Give the scheduled task GitHub access to `Investor-Dashboard`** — every run so far (this one included) has been unable to check its commit history at all due to repo-scope restriction, so half of the requested recap has been silently blank every day

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
