# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-05. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

> **⚠️ Process note (unresolved since 07-21, 16 days running):** Every daily check finds real work to log, but the task is instructed not to open a PR or push to `main` without Dallas explicitly asking, and each run lands on its own throwaway `claude/gifted-hopper-*` branch. Result: **`main`'s copy of this file has been stuck on the 2026-07-20 snapshot for 16 days** while 15+ branches with findings pile up unmerged and unread. This update again folds the most recent accurate branch forward — but it'll stay stuck on a branch too unless Dallas merges one in, or tells Claude to push straight to `main` / open a standing daily PR.
>
> **Branch-hopping caused a regression on 2026-08-04:** that day's update (`claude/gifted-hopper-3ve8i0`) was based on an older branch and accidentally un-corrected the "eBay CSV import built" line back to done, undoing the 08-02/08-03 fix. This update reverts to the corrected 08-03 branch (`claude/gifted-hopper-a0ihun`) as the base and re-verifies the correction directly against the code.
>
> **Investor-Dashboard**: this session's GitHub access remains scoped to `card-scout` only, so Investor-Dashboard commit history could not be checked (true of every daily run since 07-21).

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page — `CardTimeline.tsx` fetches `/api/collection/:id/timeline` and renders a real Recharts area chart, not a stub
- [x] Collection value over time — `Dashboard.tsx` is wired to real `useGetPortfolioHistory`/`useGetCollectionSummary` hooks backed by `portfolio_snapshots`

## Correction (re-verified 2026-08-05, still holds)
- [ ] ~~eBay CSV import built — auto-updates inventory + current value~~ — **still not built.** Re-checked today directly against `routes/collection.ts`, `Collection.tsx`, `Insurance.tsx`: zero CSV parsing/import code anywhere. The only CSV code is *export* (the "Export CSV" buttons). If a working import exists somewhere else, tell Claude where; otherwise it's a real feature to build (see Backlog).

## In Progress / Just Sent to Replit
- [ ] **Cost basis integrity fix** — the cost-basis *columns* already exist (`purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` in `lib/db/src/schema/collection.ts`), but there's no overwrite guard: `PUT /collection/:id` in `routes/collection.ts` (line 146) unconditionally overwrites `purchasePrice` whenever it's present in the request body. **Re-checked 2026-08-05: the original description of this bug ("CSV re-imports were overwriting cost_basis") doesn't match the code** — there's no CSV import at all, so the only way `purchasePrice` gets overwritten today is through the manual edit form hitting this same `PUT` route. Worth confirming with Dallas whether the bug as experienced was actually a manual re-edit, since that changes how urgent/how-to-reproduce this is. Fix is still scoped to that one handler — stop overwriting after initial set (or require an explicit "recalculate" flag), default null/unestimated, split Confirmed vs. Estimated profit reporting. `price_history.source` (`"acquired" | "ebay" | "manual"`) already exists and is set on item creation, so the Confirmed/Estimated split has its data source ready for free.
- [ ] Real eBay OAuth (user-level, refresh token) — `routes/auth.ts` has a working OIDC authorization-code + PKCE flow with refresh-token storage (via `openid-client`), but it's built for Replit's OIDC provider, not eBay's OAuth2. Treat it as a structural reference (session storage, expiry tracking) rather than a drop-in port.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. No schema groundwork for this yet.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — re-confirmed 2026-08-05 that `Dashboard.tsx` and `CardTimeline.tsx` both still hand-roll inline currency/date formatting in `tickFormatter` instead of reusing `formatCurrency`/`formatDate` from `src/lib/utils.ts`; still worth checking whether fixing the dedup fixes the warning too

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Wishlist ↔ Deal Finder cross-link
- [ ] Price-check timestamp (show when a price was last refreshed)
- [ ] Image caching for card images
- [ ] "% inventory with confirmed cost" metric — near-free once the cost-basis Confirmed/Estimated split lands, since `price_history.source` already distinguishes acquired/manual vs. ebay
- [ ] Manual-entry-first path — ship basic sold-item P/L tracking via manual entry before the full eBay OAuth port lands
- [ ] Migrate eBay Finding API → Browse API (Finding API is the legacy/deprecated one)
- [ ] Consolidate `lib/ebay.ts` and `routes/deals.ts` into one shared eBay client — both independently build near-identical Finding-API requests and duplicate median-price calculation, and neither retries on transient failures, so a single 502/503 currently fails a price-refresh item for a full 24h cycle
- [ ] Add a minimal test harness before touching cost-basis math — zero automated tests exist anywhere in the repo (no `*.test.*`/`*.spec.*`, no `test` script in any `package.json`); start with the `PUT /collection/:id` handler specifically, since that's the one about to change
- [ ] Build the real CSV import — genuine gap now that the old "CSV import built" claim is confirmed false
- [ ] Decide the long-term Card Scout / Investor-Dashboard relationship (stay separate vs. eventual merge) — several items above depend on this

## New this check (2026-08-05)
- [ ] **Clarify the cost-basis bug's actual trigger** — see note under "Cost basis integrity fix" above. The fix plan doesn't change, but the root-cause story (CSV re-imports) is unsupported by the code, so root-causing against the real trigger (manual edit form) will save time once work starts.
- [ ] **Add a `PATCH`-style partial-update guard** to `PUT /collection/:id` generally, not just for `purchasePrice` — the same unconditional-overwrite pattern at that handler likely applies to `gradingFee`/`shippingFee`/`otherFees` too, so the cost-basis fix should probably cover all four fee fields together rather than just `purchasePrice`.
- [ ] **Standing-PR or direct-push decision** — this is the 16th consecutive daily run to hit the "no new commits, findings stuck on an orphaned branch" outcome. Worth explicitly deciding: (a) have Claude open a small PR each day so it's a one-click merge, (b) authorize direct pushes to `main` for this file specifically, or (c) accept the branches as an archive and have Dallas periodically consolidate manually.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
