# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-24. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Note: this session's GitHub access is scoped to `card-scout` only — it could not read commit history on `Investor-Dashboard`. If that repo also gets active work, either broaden this task's repo scope or track its progress separately._

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
- [ ] **Migrate off eBay's legacy Finding API before it breaks** — `priceRefreshJob.ts` and `deals.ts` both call `svcs.ebay.com/.../FindingService` (`findCompletedItems` / `findItemsAdvanced`). eBay has been sunsetting this API in favor of Browse API + Marketplace Insights (which needs its own approval for sold-comps access); worth migrating proactively rather than discovering it's been silently returning empty results
- [ ] Scaffold `isSold` / `soldAt` / `soldPrice` columns on `collection_items` now — the schema has no sold-state fields yet, so the "Sold-item sync" item above can't start until this lands. Adding it now (default `isSold: false`) unblocks that work incrementally even before eBay OAuth is ready
- [ ] Price refresh job silently marks failed/no-comp items as "checked" (`priceRefreshJob.ts` catch block) — a persistent eBay auth/rate-limit error looks identical to "no comps found" in the data. Add a distinct failure reason/log surface so real API breakage doesn't hide as normal "no comps" noise

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
