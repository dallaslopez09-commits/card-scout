# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-17. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Check note (2026-08-17): No new commits on `card-scout` main since the 2026-07-20 PROGRESS.md commit (last real code commit is still `ff3caf3`, 2026-07-15). Code inspection confirms none of the "In Progress" or "Quick Wins" items below have landed in card-scout yet. This session's GitHub access is scoped to `card-scout` only, so `Investor-Dashboard` commit history could not be checked — its rows below are carried forward unverified._

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

## New Ideas (2026-08-17, from code review)
- [ ] **Wire cost-basis confirmed/estimated split into the existing refresh job** — `priceRefreshJob.ts` already writes `currentValue`/`ebayCheckedAt`/`cardPriceHistoryTable` on every tick; the pending cost-basis fix (set-once, never overwritten by re-import) can piggyback on this same write path instead of a new one.
- [ ] **"Collection value over time" backlog item is mostly free** — `portfolioSnapshotsTable` is already being written on every refresh and every manual collection edit (`collection.ts`). The data model for a value-over-time chart already exists; this is a frontend chart, not a new pipeline.
- [ ] **Card detail price-history chart is also mostly free** — `cardPriceHistoryTable` already stores per-card price + source + timestamp on each eBay refresh. The "Card detail page (price history chart)" backlog item just needs a route + chart component reading this table; no new backend work required.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
