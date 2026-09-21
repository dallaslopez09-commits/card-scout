# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-21. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Standing issue: two months of daily updates never reached `main`
`main` has had zero new commits since **2026-07-20** (this file's own creation) and zero code commits since **2026-07-15**. Every scheduled run since then — 65+ daily check-ins — pushed its update to its own throwaway `claude/gifted-hopper-*` branch and never merged, because no PR gets opened automatically and this task doesn't push to `main` directly. Corrections made on `main` this way have been getting rediscovered and lost repeatedly (e.g. the CSV-import line below was corrected to "false" on at least 6 separate branches since 2026-07-30, but kept reverting to "done" on `main` because nothing landed). This update rebuilds from the most code-verified branch (`claude/gifted-hopper-13e3oc`, 2026-09-15) rather than stale `main`, and re-verifies everything directly against the checked-out code. **This is the single highest-value fix available right now: either merge one of these branches, ask for a standing PR this task can keep updating, or tell it to push straight to `main`.**

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price history page — `CardTimeline.tsx` + its timeline endpoint are live (verified in code)
- [x] Collection value over time chart — `Dashboard.tsx` "Portfolio Value History" `AreaChart`, backed by `portfolio_snapshots` (verified in code)

## Corrected (was marked done, isn't)
- [ ] **eBay CSV import** — false. Verified directly: `Collection.tsx` only has export-to-file (`handleExportCsv`/`downloadCsv`); no import route exists anywhere under `api-server/src/routes`. Re-flagged by nearly every check-in since 2026-07-30.

## In Progress / Just Sent to Replit
(No commits have landed against any of these since 2026-07-15 — still 0% in the actual code.)
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`api-server/src/routes/collection.ts` lines 146, 151–153) still unconditionally overwrites `purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` on every call, no guard against re-setting an already-confirmed cost basis. Note: the documented root cause ("CSV re-imports overwriting cost_basis") can't be right since no CSV import exists — the actual trigger is almost certainly the manual edit form hitting this same route.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. Blocked on schema: `collection_items` still has no `soldAt`/`status` columns.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Security — verified still open
- [ ] **Unauthenticated private object storage** — `GET /storage/objects/*` in `api-server/src/routes/storage.ts` (~lines 139–153) has its auth/ACL check commented out ("uncomment when using replit-auth"). Anyone who knows or guesses an object path can read private uploads (card photos, insurance docs) with zero auth. Live hole, not backlog — worth fixing ahead of the queued feature work.

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop bug — pinpointed: `Dashboard.tsx`'s `<YAxis>` sets `tickFormatter` twice as a literal duplicate JSX prop (plain `$val` on line 200, then the nicer `$X.Xk` formatter on line 205). One-line fix: delete line 200.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Minimal test harness + CI workflow — repo has zero test files and no `.github/workflows`; worth having before the cost-basis math change touches real financial numbers
- [ ] `isCostConfirmed` flag on `collection_items` (or reuse `price_history.source`, which already distinguishes `acquired`/`manual`/eBay) to drive the Confirmed vs. Estimated split, instead of inferring it from null-checks on the fee fields
- [ ] `soldAt`/`soldPrice`/`status` columns on `collection_items` — needed before sold-item sync can lock in realized P/L or move cards to an archive
- [ ] `portfolio_snapshots` currently only tracks `totalValue`/`totalCost` — once sold-item tracking exists, snapshot realized vs. unrealized separately so the P/L tab doesn't have to reconstruct history after the fact
- [ ] Consolidate `lib/ebay.ts` + `routes/deals.ts`'s duplicated, retry-less eBay Finding API logic into one shared client with backoff — right now a single transient 502/503 permanently fails a price-refresh item for 24h

## New ideas (from 2026-09-21 code check)
- [ ] **Card-scan dedup is silently broken** — `POST /cards/scan` (`api-server/src/routes/cards.ts` line 140) calls `.onConflictDoNothing()`, but `cardsTable`'s only unique column is `id`, and `id` is a fresh `randomUUID()` on every scan — so the conflict guard can never actually fire. Re-scanning the same physical card always inserts a new duplicate `cards` row instead of deduping. Fix: add a unique index on a natural key (e.g. `name` + `cardSet` + `cardNumber` + `year`) and look up before inserting.
- [ ] **"% inventory with confirmed cost" metric is nearly free today** — `price_history.source` already distinguishes `acquired`/`manual` entries from eBay-derived ones, so this Dashboard metric (already promised under the cost-basis fix) could ship now as a standalone quick win, without waiting on the full overwrite-guard/Confirmed-vs-Estimated split.
- [ ] **`portfolio_snapshots` has no throttle** — every call to the collection summary endpoint inserts a new snapshot row, so a chart meant to show value *over time* is really just recording read frequency. Move the insert to the existing scheduled price-refresh job (or gate it to once/day) so the "value over time" chart stays meaningful and the table doesn't bloat.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
