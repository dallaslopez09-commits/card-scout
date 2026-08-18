# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-18. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Check note (2026-08-18): No new commits on `card-scout` main since the 2026-07-20 PROGRESS.md commit (last real code commit is still `ff3caf3`, 2026-07-15 — 34 days). This session's GitHub access is scoped to `card-scout` only, so `Investor-Dashboard` commit history could not be checked; its rows below are carried forward unverified._

**⚠️ Process problem, unresolved for a month:** since 07-21, every daily check has landed on its own throwaway `claude/gifted-hopper-*` branch instead of merging to main. **26 of these branches now exist with zero PRs ever opened and zero merges.** That's why this file's "Last updated" date has been stuck at 07-20 on `main` even though 26 days of corrected findings exist on orphaned branches — each day's run has had to reconstruct the tracker from whichever prior branch looked most accurate, and multiple times a correction (e.g. the CSV-import line below) got silently reverted when a run diffed against stale `main` instead. Dallas's own real commit, `gitignore-security-fixes` (2630f705, 2026-08-05), is also still unmerged — 13 days now. **Recommend deciding: either give this task permission to open a standing PR each day, or have it push directly to `main`** — otherwise none of this ever reaches you as intended.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page (`CardTimeline.tsx`, 250 lines) — reads `cardPriceHistoryTable`, live
- [x] Collection value over time chart (`Dashboard.tsx`, 294 lines) — reads `portfolioSnapshotsTable`, written on every refresh and manual edit, live

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`routes/collection.ts` lines 146, 151–153) unconditionally overwrites `purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` with no guard. Fix should only set each once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric. Note: the documented trigger ("CSV re-imports overwriting cost_basis") doesn't match the code — there is no CSV import route, so the actual trigger is the manual-edit form hitting this same PUT route.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] ~~eBay CSV import built~~ — **correcting again: this is false.** Verified directly in code (`Collection.tsx`, `Insurance.tsx`) that only CSV *export* exists (`handleExportCsv`/`downloadCsv`); no import route anywhere in `api-server/src/routes`. This has been found and corrected on at least 4 prior runs (08-02, 08-03, 08-13, 08-14) and kept reverting because corrections live on orphaned branches — see process note above.
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop bug — pinpointed: `Dashboard.tsx` `YAxis` has two `tickFormatter` props (line 200: `` `$${val}` ``, line 205: the `k`-suffix formatter). This isn't a vague "warning," it's a literal duplicate JSX prop — delete line 200, keep 205. One-line fix, ready to ship.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] No CI workflow anywhere in the repo
- [ ] No API rate limiting on the server
- [ ] `lib/ebay.ts` and `routes/deals.ts` duplicate Finding-API request logic with no shared retry/backoff — a transient 502/503 permanently fails a price-refresh item for 24h
- [ ] `POST /collection/refresh-prices` duplicates the scheduled price-refresh job's eBay loop but skips its lock, 600ms throttle, and price-history logging
- [ ] `GET /collection/summary` inserts a new `portfolioSnapshots` row on every call with no throttle — will bloat the table and add noise to the value-over-time chart
- [ ] `deals.ts` `minDiscount` param accepts unvalidated input
- [ ] Zero test files anywhere in the repo

## New Ideas (2026-08-18, from code review)
- [ ] **Wishlist price-drop alerts using the field that's already there** — `wishlistItemsTable.targetPrice` exists and is stored/returned by `routes/wishlist.ts`, but nothing reads it to compare against live prices. The price-refresh job and Deal Finder (`routes/deals.ts`) already pull current eBay prices on a schedule; cross-referencing against `targetPrice` on each tick would surface "your wishlist item hit its target" almost for free. (Also revives the 07-24 "wishlist/deals cross-link" idea that was lost when that day's branch never merged.)
- [ ] **Cost-basis overwrite guard should ship as one PR with the `tickFormatter` fix** — both are small, well-understood, zero-risk changes sitting in a repo that hasn't shipped code in 34 days. Bundling them would break the "nothing lands" streak with minimal review burden.
- [ ] **Standing PR or direct-push for this daily task** (see process note above) — the single highest-leverage fix available right now, since every other item on this list depends on updates actually reaching `main`.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
