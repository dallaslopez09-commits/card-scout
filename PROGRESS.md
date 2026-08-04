# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-04. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_2026-08-04 check: no new commits on `card-scout` since 2026-07-20 (last commit `4891505`). Investor-Dashboard was out of this session's GitHub access scope and could not be checked — see recap. Nothing below moved from pending to done; code inspection confirms the pending items still match the current schema/routes (no `cost_basis`/confirmed-vs-estimated fields, no sold/archive status column, no eBay OAuth refresh-token flow, Deal Finder still calls the legacy Finding API rather than Browse API)._

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
- [ ] _(new 2026-08-04)_ Migrate Deal Finder off the legacy eBay Finding API (`findCompletedItems` via `svcs.ebay.com`) onto the Browse API — Finding API is deprecated and this is likely why the "post eBay Browse API fix" smoke test is still queued
- [ ] _(new 2026-08-04)_ Add a `status` column to `collection_items` (active/sold/archived) now, ahead of the full sold-sync feature — unblocks building the archive view incrementally instead of in one big OAuth+sync+archive push
- [ ] _(new 2026-08-04)_ Add a `costBasisConfirmed` boolean (or similar) to `collection_items` alongside the existing `purchasePrice`/fee columns — the schema already tracks fees for "true cost basis" per the code comment, but has no confirmed-vs-estimated flag yet

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
