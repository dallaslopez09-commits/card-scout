# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-12 (content unchanged; check-in only). No new commits on card-scout's `main` since 2026-07-20. Investor-Dashboard could not be checked this run — this session's GitHub access is scoped to `card-scout` only. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

**⚠️ Operational note:** dozens of prior scheduled runs (`claude/gifted-hopper-*` branches back to at least 2026-08-23) made check-ins and even queued new ideas below, but none were ever merged to `main` — no PR gets opened automatically, so every update landed on an orphaned branch and never reached this file. This run's findings incorporate the unmerged 2026-08-23 ideas (still valid, verified against current schema) so they aren't lost again. Worth deciding: should this task open a PR each run, or push straight to `main`?

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

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily

## New Ideas (from 2026-09-12 code check; carried over from an unmerged 2026-08-23 run, re-verified against current schema)
- [ ] `collection_items` (lib/db/src/schema/collection.ts) still has no `soldAt` / `soldPrice` / `status` columns — needed before the sold-item sync work can lock in realized P/L or move cards to an archive
- [ ] `purchasePrice` on `collection_items` still has no companion "confirmed vs. estimated" flag — add an `isCostConfirmed` boolean alongside the cost-basis integrity fix so the split reporting has something to key off of
- [ ] `portfolio_snapshots` (lib/db/src/schema/portfolio.ts) still only tracks `totalValue`/`totalCost` — once sold-item tracking exists, snapshot realized vs. unrealized separately so the future P/L tab doesn't have to reconstruct history after the fact
