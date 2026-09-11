# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-11. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Note: No commits landed on card-scout in the last 24h — the repo has been quiet since the 2026-07-20 commit (~7.5 weeks). This session's GitHub access is scoped to card-scout only, so Investor-Dashboard's commit history could not be checked — grant that repo's access to this session (or check manually) for a full cross-repo recap._

_⚠️ Process flag: this daily task has been running since 2026-07-20 (30+ runs) but every run pushes to a new throwaway `claude/gifted-hopper-*` branch that's never merged or opened as a PR against `main`. That means this file on `main` was frozen at the 2026-07-20 snapshot the whole time, even though the daily check-ins kept happening on disconnected branches nobody read. This edit is going to the same kind of branch — if you want future updates to actually reach `main`, tell the task to open a PR (or merge) instead of just pushing to a branch._

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
- [ ] **Sold-item sync needs a schema migration first** — `collection_items` currently has no `status`/`soldAt`/`soldPrice` columns, so the "In Progress" sold-item sync item (locks in realized P/L, archives sold cards) has no place to land yet. Worth adding that migration before wiring the sync job itself.
- [ ] **Wire `card_price_history` into a value-over-time chart** — the table already stores per-collection-item price points with a `source` ("acquired"/"ebay"/"manual") and `recordedAt`, but nothing currently reads it for charting. This mostly de-risks the existing "Collection value over time (sparkline/chart per card)" backlog item — the hard part (the data model) is already built, just unused.
- [ ] **Surface true cost basis in the UI** — `collection_items` already tracks `gradingFee`, `shippingFee`, and `otherFees` alongside `purchasePrice`, but there's no computed "total cost basis" (purchase + fees) exposed anywhere. Ties directly into the "Cost basis integrity fix" item above — the fee data is being captured but doesn't look like it's being used yet.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
