# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-03. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

> **⚠️ Process note (read first):** This check has run correctly every day since 2026-07-21, but each run lands on its own new throwaway `claude/gifted-hopper-*` branch, and the task is instructed not to open a PR or push to `main` without Dallas explicitly asking. Result: **`main`'s copy of this file was stuck on the 2026-07-20 snapshot for 14 days** while real findings piled up on unmerged branches nobody read. This update folds all of that forward again — but it'll stay stuck on a branch too unless Dallas merges one of these branches into `main` or asks Claude to open a standing PR each day.
>
> **Investor-Dashboard**: this session's GitHub access remains scoped to `card-scout` only, so Investor-Dashboard commit history could not be checked (true of every daily run since 07-21).

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page — `CardTimeline.tsx` fetches `/api/collection/:id/timeline` and renders a real Recharts area chart, not a stub
- [x] Collection value over time — `Dashboard.tsx` is wired to real `useGetPortfolioHistory`/`useGetCollectionSummary` hooks backed by `portfolio_snapshots`

## Correction (verified, still holds as of 2026-08-03)
- [ ] ~~eBay CSV import built — auto-updates inventory + current value~~ — **this was never actually built.** Re-checked today: still zero CSV parsing/import code anywhere in the repo. The only CSV code that exists is *export* (`Collection.tsx`, `Insurance.tsx` — "Export CSV" buttons). If a working import exists somewhere else, tell Claude where; otherwise it's a real feature to build (see Backlog).

## In Progress / Just Sent to Replit
- [ ] **Cost basis integrity fix** — the cost-basis *columns* already exist (`purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` in `lib/db/src/schema/collection.ts`), but there's no overwrite guard: `PUT /collection/:id` in `routes/collection.ts` (~line 146) unconditionally overwrites `purchasePrice` whenever it's present in the request body. Fix is scoped to that one handler — stop overwriting after initial set (or require an explicit "recalculate" flag), default null/unestimated, split Confirmed vs. Estimated profit reporting. `price_history.source` (`"acquired" | "ebay" | "manual"`) already exists and is set on item creation, so the Confirmed/Estimated split has its data source ready for free.
- [ ] Real eBay OAuth (user-level, refresh token) — `routes/auth.ts` has a working OIDC authorization-code + PKCE flow with refresh-token storage (via `openid-client`), but it's built for Replit's OIDC provider, not eBay's OAuth2. Treat it as a structural reference (session storage, expiry tracking) rather than a drop-in port.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. No schema groundwork for this yet.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix

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

## New this check (2026-08-03)
- [ ] **Dedup chart tick formatting** — `Dashboard.tsx` and `CardTimeline.tsx` both hand-roll inline currency/date formatting in `tickFormatter` props (e.g. `` `$${val}` ``, a custom k-suffix formatter) instead of reusing `formatCurrency`/`formatDate` from `src/lib/utils.ts`, which already exist and are used elsewhere. Worth checking whether this inline duplication is actually the source of the "Vite duplicate-export warning" quick win above — if so, fixing the dedup fixes both at once.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
