# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-09. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

**Heads up:** no new commits have landed on `card-scout` `main` since 2026-07-15 (code) / 2026-07-20 (this tracker) — almost two months. Every scheduled check since then (2026-07-21 through today) has come up empty and pushed its "still pending" update to its own throwaway `claude/gifted-hopper-*` branch instead of `main`, since these runs aren't told to open a PR. There are ~29 of those branches sitting unmerged in the repo now, none of them ever merged — so this tracker on `main` has been stale since July 20 even though the daily check kept running. This run's update lands on the same kind of throwaway branch (`claude/gifted-hopper-7kpxm2`); someone needs to merge it (or a future run needs to be pointed at `main`) for this file to actually stay current for Dallas. If work is happening in Replit, it isn't being pushed to GitHub — worth checking the Replit workspace directly. Investor-Dashboard is out of scope for this session's GitHub access, so it isn't covered by this file's commit check.

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
- [ ] **Insurance appraisal export** — there's already an insurance page and per-card timeline; add a one-click PDF/CSV export (photo, purchase date, cost basis, current value) per card or full collection, since that's the artifact an actual insurer or claim would want
- [ ] **Saved Deal Finder alerts** — Deal Finder already queries the eBay Browse API on demand; let a search (card/set/price threshold) be saved and checked on the existing price-refresh job schedule, with a notification when a match appears, instead of requiring a manual look each time
- [ ] **Scheduled collection export/backup** — a periodic CSV/JSON dump of the full collection (independent of the eBay CSV import path) as a disaster-recovery safety net, especially since cost-basis integrity is already a known fragile spot

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
