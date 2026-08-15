# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-15. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Check note (2026-08-15): No commits landed on card-scout in the last 24h — or at all since 2026-07-20 (this file's own creation commit). The four "In Progress / Just Sent to Replit" items below still show no trace in the code (verified directly: no `cost_basis`/confirmed-vs-estimated fields, no eBay user OAuth beyond the existing Replit app-login OIDC flow, no sold/archive fields in the schema). This session's GitHub access is scoped to card-scout only, so Investor-Dashboard activity could not be checked this run — worth confirming that repo separately. Nothing has been checked off below since nothing new is confirmed done._

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] eBay CSV import built — auto-updates inventory + current value (note: no CSV import code found anywhere in the card-scout repo — this likely lives in Investor-Dashboard; worth confirming since this session couldn't check that repo)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — CSV re-imports were overwriting cost_basis; should only set once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — confirmed still present: `YAxis` in `artifacts/card-scout/src/pages/Dashboard.tsx` has two `tickFormatter` props (lines 200 and 205); the second silently wins

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] *(2026-08-15)* Wire `gradingFee`/`shippingFee`/`otherFees` into the actual profit/value math — these columns already exist on `collection_items` but `portfolio.ts` never reads them, so grading/shipping costs aren't in any P/L number yet even though the schema was built for it
- [ ] *(2026-08-15)* Staleness indicator using `ebayCheckedAt` — the field is already populated by the price refresh job; surfacing "comps last checked Xd ago" per card would make the eventual manual "Sync Now" button (in the sold-item sync work) more legible
- [ ] *(2026-08-15)* Since Real eBay OAuth is being ported from Investor-Dashboard, consider extracting the OAuth/session logic into a shared `lib/` package now rather than copy-pasting — `lib/replit-auth-web` already shows the monorepo's pattern for shared auth code

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
