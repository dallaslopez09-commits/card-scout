# Legends & Lunatics — Progress Tracker

_Last updated: 2026-07-29. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_2026-07-29 check: no new commits on `card-scout` `main` in the last 24h — last real code commit is still `ff3caf3` (2026-07-15, now 14 days ago). `Investor-Dashboard` still could not be checked — this session's GitHub access remains scoped to `card-scout` only._

_**Process note (carried forward, still unresolved):** every daily check since 07-21 has committed to its own throwaway branch (`claude/gifted-hopper-*`) instead of `main`, and no PR has ever been opened for any of them (`list_pull_requests` on this repo still returns zero, open or closed) — so `main` has sat on the 07-20 version of this file for 9 days while real notes piled up on orphaned branches (07-21 through 07-26 and 07-28 all exist; no branch was created for 07-27, so that day's check either didn't run or failed silently). This run again folds forward the accumulated notes and commits on its assigned branch, same as every run before it. **This still needs a decision from Dallas:** either point this task at opening (and auto-merging) a PR each day, or have it push straight to `main`, or manually merge one of the pending branches now. Until one of those happens, this file's `main` copy will keep drifting further from reality._

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] eBay CSV import built — auto-updates inventory + current value
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — **correction from prior notes:** there's no single `cost_basis` column, but `collection_items` already has `purchase_price`, `grading_fee`, `shipping_fee`, and `other_fees` columns (`lib/db/src/schema/collection.ts`) — the "true cost basis" building blocks already exist as `purchasePrice + gradingFee + shippingFee + otherFees`. The actual gap is (a) nothing sums these into a protected total today, and (b) CSV re-imports still write straight into `purchasePrice`, so a re-import can clobber the original buy price. Fix is likely additive — guard `purchasePrice` from re-import writes and compute the total server-side — not a new-column migration.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout. **New:** Card Scout already has a full OIDC session pattern to crib from — `routes/auth.ts` + `lib/auth.ts` implement `createSession`/`deleteSession` around a `SessionData` shape that stores `access_token`, `refresh_token`, and `expires_at`. That's the same shape an eBay refresh-token flow needs; porting eBay OAuth in can likely reuse this session/token storage pattern instead of designing one from scratch.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix) — **still blocked**: `routes/deals.ts` and `lib/ebay.ts` both still call the legacy eBay Finding API, not the Browse API. The migration hasn't happened, so this smoke test would test the wrong thing if run now.
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — `tickFormatter` is used 4x across `Dashboard.tsx` and `CardTimeline.tsx`; no fix commit found, still open.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?* **New:** the Confirmed/Estimated split this tab needs doesn't require new schema either — `card_price_history.source` already tags every price row as `"acquired" | "ebay" | "manual"` (`lib/db/src/schema/price_history.ts`). Treating `acquired`/`manual` as Confirmed and `ebay` as Estimated gets the split for free from data that's already being recorded.
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Cross-link Wishlist and Deal Finder — auto-flag when a wishlist card shows up in Deal Finder results instead of relying on manual checking (both routes already exist: `wishlist.ts`, `deals.ts`)
- [ ] Surface a "prices last checked" timestamp in the UI, sourced from `priceRefreshJob.ts` — makes staleness visible instead of implying live data. **Note:** `collection_items.ebayCheckedAt` already exists in the schema for this, so it's UI wiring, not backend work.
- [ ] Card image caching/thumbnails via the existing `object-storage-web` lib, to speed up card detail and collection grid loads
- [ ] Wire `fetchEbayComps` (in `lib/ebay.ts` — already returns median/average price, sample size, and comp listings) into a card detail endpoint + page. This would close out both the "Card detail page" and "eBay sold vs. active price badges" items above without new backend work.
- [ ] Wire the existing `/portfolio/history` endpoint (`routes/portfolio.ts`, 90-day aggregated value/cost snapshots, backed by `portfolioSnapshotsTable`) into a dashboard chart to satisfy "Collection value over time" — backend's already there.
- [ ] Migrate `deals.ts` + `ebay.ts` off the legacy Finding API to the Browse API before it gets shut off — same root cause blocking the Deal Finder quick win above, and eBay has been actively sunsetting the Finding API.
- [ ] No automated tests exist anywhere in the repo (checked for `*.test.*`, `*.spec.*`, and CI workflows — none found). Given money math (cost basis, realized/estimated P/L) is the core value of this app, worth adding unit tests around cost-basis and profit/loss calculations before building the Separate P/L tab.
- [ ] No `.env`/secrets-handling files found in the repo — worth double-checking how the eBay App ID/Cert ID and any OAuth refresh tokens are stored/loaded (Replit secrets vs. committed config) before the "Real eBay OAuth" work lands, so refresh tokens don't end up in git history.
- [ ] A lightweight "next up" pointer at the top of this file (single line: which backlog item Dallas is actually picking up next) — right now every item reads as equally queued, which makes it hard to tell from this file alone what's actually next versus just recorded.
- [ ] `priceRefreshJob.ts` schedules price refreshes but there's no visible logging/alerting if a refresh run fails (e.g. eBay API down, rate-limited) — worth adding a simple last-run-status field so a silent failure there doesn't quietly leave prices stale without anyone noticing (same class of problem as this PROGRESS.md branch issue above).
- [ ] Given the "combined view once both apps merge" question already flagged under the P/L tab, and that Investor-Dashboard can't even be checked from this session, it may be worth deciding the Card Scout / Investor-Dashboard relationship (merge, keep separate, or one feeds the other) sooner rather than later — several backlog items are already implicitly blocked on that answer.
- [ ] **New:** `collection_items.quantity` exists (defaults to 1) alongside `purchasePrice`, but it's worth confirming whether `purchasePrice` is meant as a per-unit or per-lot value before the cost-basis fix and P/L tab land — if a multi-quantity row's `purchasePrice` is actually a lot total, per-card cost-basis math needs to divide by `quantity`, and getting this wrong would silently misstate P/L.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
