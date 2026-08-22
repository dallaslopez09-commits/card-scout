# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-22. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Check note (2026-08-22): no new commits on `card-scout` since 2026-07-20 (`4891505`) — over a month of inactivity. This session's GitHub access is scoped to `card-scout` only, so `Investor-Dashboard` commit history could not be checked; re-run with that repo in scope to cover it. Nothing below changed as a result of this check — items are carried forward as-is, confirmed still accurate against the current code._

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

## New Ideas (from 2026-08-22 code check)
- [ ] `sets.ts` set-completion cost total (`routes/sets.ts:81`) sums only `purchasePrice`, while `collection.ts`'s portfolio totals sum `purchasePrice + gradingFee + shippingFee + otherFees` — the Sets view will under-report true cost vs. the Collection view for any card with fees. Worth reconciling once the cost-basis fix lands.
- [ ] `collection_items` has no `isSold`/`soldAt`/`salePrice` columns yet — the pending "Sold-item sync" work will need this schema added before the sync job/archive move can be built; flagging now since fee-tracking columns (`gradingFee`/`shippingFee`/`otherFees`) already show the intended pattern (nullable, added alongside `purchasePrice`) to follow for consistency.
- [ ] `price_history` rows already carry a free-text `note` field for provenance (e.g. "eBay median from 8 sold comps") — the same pattern could back the "Confirmed vs. Estimated" cost-basis split: a `costBasisSource` note/enum on `collection_items` would let the UI show *why* a cost is confirmed vs. estimated, not just that it is.
