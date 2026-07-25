# Legends & Lunatics — Progress Tracker

_Last updated: 2026-07-25. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_2026-07-25 check: no new commits on `card-scout` `main` since 2026-07-20 (last code commit `ff3caf3`, 2026-07-15; last tracker commit `4891505`). `Investor-Dashboard` still could not be checked — this session's GitHub access is scoped to `card-scout` only. **Heads up:** the daily checks from 07-21 through 07-24 each committed to their own branch (`claude/gifted-hopper-*`), but none were opened as a PR or merged — `main` had been stuck on the 07-20 version of this file the whole time, and those branches are now orphaned/deleted. This run resets from `main` and folds the useful bits (backlog ideas from the 07-24 run) back in. Worth checking why PRs from this daily task aren't landing on `main`._

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
- [ ] Cross-link Wishlist and Deal Finder — auto-flag when a wishlist card shows up in Deal Finder results instead of relying on manual checking (both routes already exist: `wishlist.ts`, `deals.ts`)
- [ ] Surface a "prices last checked" timestamp in the UI, sourced from `priceRefreshJob.ts` — makes staleness visible instead of implying live data
- [ ] Card image caching/thumbnails via the existing `object-storage-web` lib, to speed up card detail and collection grid loads
- [ ] Wire `fetchEbayComps` (in `lib/ebay.ts` — already returns median/average price, sample size, and comp listings) into a card detail endpoint + page. This would close out both the "Card detail page" and "eBay sold vs. active price badges" items above without new backend work.
- [ ] Wire the existing `/portfolio/history` endpoint (`routes/portfolio.ts`, 90-day aggregated value/cost snapshots, backed by `portfolioSnapshotsTable`) into a dashboard chart to satisfy "Collection value over time" — backend's already there.
- [ ] Verify the "Deal Finder ... post eBay Browse API fix" quick win: both `deals.ts` and `ebay.ts` still call the legacy eBay **Finding API** (`svcs.ebay.com/.../FindingService`), not the Browse API. eBay has been deprecating Finding API — confirm this was actually migrated before marking that quick win done, or the smoke test will be testing the wrong thing.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
