# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-11. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

> **2026-08-11 check:** No new commits landed on `card-scout`'s `main` in the last 24h — `main` is now **22 days stale** (still the 2026-07-20 snapshot; the actual last code commit, `ff3caf3`, is from 07-15, 27 days ago). Investor-Dashboard still could not be checked; this session's GitHub access remains scoped to `card-scout` only. Zero PRs have ever been opened on this repo (confirmed via API, not just an unmerged-branch count).
>
> This update was built off the most recent accurate branch (`claude/gifted-hopper-iyl4g8`, 08-10) rather than stale `main`, per the standing practice since the 08-06 regression.
>
> **`gitignore-security-fixes` still unmerged**, now 6 days since Dallas pushed it (`2630f705`, 2026-08-05). Still a pure `.gitignore` hygiene commit with no functional risk — still the easiest candidate to break the "nothing ever merges" pattern.
>
> **20 daily-check branches now sit unmerged with zero PRs opened** (19 prior + this one). The standing-PR/direct-push decision below is now over 3 weeks overdue and is now the single biggest blocker to this file being useful — every day's findings pile onto another orphaned branch instead of reaching Dallas.
>
> Two new backlog items added below from a fresh read of the code (see bottom of Backlog) since there was no new commit activity to report on.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page — `CardTimeline.tsx` fetches `/api/collection/:id/timeline` and renders a real Recharts area chart, not a stub
- [x] Collection value over time — `Dashboard.tsx` is wired to real `useGetPortfolioHistory`/`useGetCollectionSummary` hooks backed by `portfolio_snapshots`

## Correction (re-verified 2026-08-11, still holds)
- [ ] ~~eBay CSV import built — auto-updates inventory + current value~~ — **still not built.** Zero CSV parsing/import code anywhere in `routes/collection.ts`, `Collection.tsx`, `Insurance.tsx`. Only CSV code is *export*. If a working import exists somewhere else, tell Claude where; otherwise it's a real feature to build (see Backlog).

## In Progress / Just Sent to Replit
- [ ] **Cost basis integrity fix** — the cost-basis *columns* already exist (`purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` in `lib/db/src/schema/collection.ts`), but there's no overwrite guard: `PUT /collection/:id` in `artifacts/api-server/src/routes/collection.ts` (~line 146) unconditionally overwrites `purchasePrice` whenever it's present in the request body. The original bug description ("CSV re-imports were overwriting cost_basis") doesn't match the code since no CSV import exists — the only way `purchasePrice` gets overwritten today is the manual edit form hitting this same `PUT` route. Worth confirming with Dallas whether the bug as experienced was actually a manual re-edit. Fix stays scoped to that handler — stop overwriting after initial set (or require an explicit "recalculate" flag), default null/unestimated, split Confirmed vs. Estimated profit reporting. `price_history.source` (`"acquired" | "ebay" | "manual"`) already exists and is set on item creation, so the Confirmed/Estimated split has its data source ready for free.
- [ ] Real eBay OAuth (user-level, refresh token) — `routes/auth.ts` has a working OIDC authorization-code + PKCE flow with refresh-token storage (via `openid-client`), but it's built for Replit's OIDC provider, not eBay's OAuth2. Treat it as a structural reference (session storage, expiry tracking) rather than a drop-in port.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. No schema groundwork for this yet.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — `Dashboard.tsx` and `CardTimeline.tsx` both still hand-roll inline currency/date formatting in `tickFormatter` instead of reusing `formatCurrency`/`formatDate` from `src/lib/utils.ts`; still worth checking whether fixing the dedup fixes the warning too
- [ ] **Merge or review the `gitignore-security-fixes` branch** — Dallas's own commit (`2630f705`), pure `.gitignore` hygiene, no functional risk, sitting unmerged since 08-05. Easiest possible first PR to break the "nothing ever merges" pattern below.

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
- [ ] Standing-PR or direct-push decision — 20 consecutive daily runs have now hit the "no new commits, findings stuck on an orphaned branch" outcome, and one run (08-06) already regressed the tracker by building off stale `main`. Decide: (a) have Claude open a small PR each day so it's a one-click merge, (b) authorize direct pushes to `main` for this file specifically, or (c) accept the branches as an archive and periodically consolidate manually.
- [ ] Add CI secret-scanning (e.g. `gitleaks`) — now that `.gitignore` excludes `sql`/`dump`/`backup`/`env`/credential-shaped files going forward, a lightweight scan on push/PR would catch anything that slips past `.gitignore` (renamed files, nested paths) before it lands
- [ ] Clean up the 20 orphaned `claude/gifted-hopper-*` branches once Dallas has skimmed them for anything not already folded into this file
- [ ] **Consolidate the two eBay refresh code paths** — `POST /collection/refresh-prices` (`routes/collection.ts`) reimplements the same fetch-and-update loop as `refreshStaleItems` in `lib/priceRefreshJob.ts`, but diverges in three ways: it ignores the module-level `isRunning` lock (so a manual click while the background job is running double-hits the eBay API for the same items), it skips the 600ms `DELAY_BETWEEN_CARDS_MS` throttle, and it never inserts into `cardPriceHistoryTable` (the background job logs a `source: "ebay"` row per update; the manual route doesn't). That last gap means any item whose current value was last set via the manual refresh button will be invisible to the upcoming Confirmed/Estimated cost-basis split, which depends on `price_history.source`. Fix: have the route call `refreshStaleItems`/a shared helper instead of duplicating the loop.
- [ ] **Unbounded `portfolio_snapshots` growth** — `GET /collection/summary` (`routes/collection.ts`) inserts a new snapshot row on *every single call*, with no throttle or dedup against the last snapshot. Any dashboard page load or polling interval adds a row, which will both bloat the table over time and add noise to the "collection value over time" chart (multiple near-identical points per day instead of one meaningful one). Worth only snapshotting on a schedule (e.g. once per day, or only after a `refresh-prices` run) rather than on every summary read.
- [ ] **No CI at all** *(new, 08-11)* — there's no `.github/workflows` directory in the repo, so the root `pnpm run typecheck` / `pnpm run build` scripts that already exist never run automatically on push or PR. Right now a broken build could sit on any branch indefinitely and nobody would know until someone runs it by hand. A single lightweight Actions workflow running `pnpm run typecheck` (and `gitleaks` per the item above) on push would cover both gaps in one PR.
- [ ] **No rate limiting or request-size limits on the API server** *(new, 08-11)* — `artifacts/api-server/src/app.ts`/`index.ts` have no `express-rate-limit` or similar middleware on any route, including the eBay-proxying ones (`deals`, `collection/refresh-prices`). Low risk today at single-user scale, but worth adding before this is ever exposed beyond Dallas, since an accidental client-side retry loop could burn through eBay API quota just as easily as abuse could.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
