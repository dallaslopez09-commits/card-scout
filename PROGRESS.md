# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-15. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Standing issue: these daily updates aren't reaching `main`
Main has had zero new commits since **2026-07-20** (this PROGRESS.md file itself), and zero code commits since **2026-07-15**. Every scheduled run since then — **30+ daily check-ins** — has pushed its update to its own throwaway `claude/gifted-hopper-*` branch and never merged, because no PR has ever been opened on this repo and this task doesn't push to `main` directly. The result: this file has been silently stale on `main` for **~8 weeks** even though a Claude session has been diffing the code and writing findings every day. Nothing here will land until Dallas either merges one of these branches into `main`, asks for a standing PR the task can update, or tells the task to push to `main` directly. This run is on `claude/gifted-hopper-13e3oc` and will suffer the same fate unless merged.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price history page — `CardTimeline.tsx` + `GET /collection/:id/timeline` are live (verified directly in code)
- [x] Collection value over time chart — `Dashboard.tsx` "Portfolio Value History" `AreaChart`, backed by `portfolio_snapshots` (verified directly in code)

## Corrected (was marked done, isn't)
- [ ] **eBay CSV import** — false. Verified directly: `Collection.tsx` only has `handleExportCsv`/`downloadCsv` (export-to-file), and there is no import route anywhere in `api-server/src/routes`. This has been re-flagged by nearly every check-in since 2026-07-30 but the wrong "done" line has stayed on `main` because no update has ever merged.

## In Progress / Just Sent to Replit
(No commits have landed against any of these since 2026-07-15 — still 0% in the actual code.)
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`api-server/src/routes/collection.ts` lines 144–154) still unconditionally overwrites `purchasePrice`, `gradingFee`, `shippingFee`, `otherFees`, and `currentValue` on every call, no guard against re-setting an already-confirmed cost basis
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Security — verified still open
- [ ] **Unauthenticated private object storage** — `GET /storage/objects/*` in `api-server/src/routes/storage.ts` (lines 139–153) has its auth/ACL check commented out ("uncomment when using replit-auth"). Anyone who knows or guesses an object path can read private uploads (card photos, insurance docs) with zero auth. This is a live hole, not a backlog item — worth fixing ahead of the queued feature work.

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop bug — pinpointed: `Dashboard.tsx` `<YAxis>` (lines 199–206) sets `tickFormatter` twice as a literal duplicate JSX prop (plain `$val` on line 200, then the nicer `$X.Xk` formatter on line 205). One-line fix: delete line 200.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Minimal test harness + CI workflow — repo has zero test files and no `.github/workflows` of any kind (verified); worth having before the cost-basis math change touches real financial numbers
- [ ] `costConfirmed` flag (or reuse `cardPriceHistoryTable.source`, which already distinguishes `"acquired"`/`"manual"`/eBay) to drive the Confirmed vs. Estimated split, instead of inferring it from null-checks on the fee fields — ties directly into both the cost-basis fix and the P/L tab above

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
