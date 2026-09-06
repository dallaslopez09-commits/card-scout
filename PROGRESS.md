# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-06. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Note: this session's GitHub access only covers `card-scout`, not `Investor-Dashboard` — that repo's commit history could not be checked and its status below is carried over unverified._

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
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix) — code audit (2026-09-06) shows `routes/deals.ts` is functional but still calls the legacy Finding API, not the Browse API; the "post eBay Browse API fix" premise hasn't landed yet
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — confirmed still present: `artifacts/card-scout/src/pages/Dashboard.tsx` has two `tickFormatter` props on the same `<YAxis>` element (~line 200 and ~205); delete the first, one-line fix

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Add `status`/`soldAt`/`soldPrice` columns to the collection schema now, ahead of the full sold-item sync build — lets the cost-basis-lock and archive work start on real fields instead of another migration later
- [ ] Have `priceRefreshJob` surface "0 comps found" separately from "eBay call failed" in its refresh-status output — right now both collapse into the same `failed` counter, so a bad API key would look identical to normal thin-comp cards and could hide an outage silently
- [ ] Fix `topLoser`/`topGainer` in `routes/collection.ts`'s `/collection/summary` — with a single-item (or all-gainer) collection, `sorted[sorted.length-1]` can return the same card as `topGainer`, mislabeling a gain as the "top loser"

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
