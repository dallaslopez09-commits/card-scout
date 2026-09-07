# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-07. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

_Check-in note (2026-09-07): no commits on `card-scout` since 2026-07-20 (~7 weeks) — nothing below changed as a result of this check. This session's GitHub access is currently scoped to `card-scout` only, so `Investor-Dashboard` commit history could not be checked; its section of this file is carried forward unverified._

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
- [ ] Card detail page (price history chart, comps, eBay link, notes) — *note: `CardTimeline.tsx` + `/api/collection/:id/timeline` already render a per-card price history area chart, so this is partly built; remaining work is comps + eBay link + notes on that same page.*
- [ ] Collection value over time (sparkline/chart per card) — *same overlap as above; `priceRefreshJob.ts` + `price_history` table are already populating the data this needs.*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user

### New ideas (from 2026-09-07 code check)
- [ ] The DB schema has `purchasePrice` (`purchase_price`, defaults to `0`) on the collection table — there's no separate `cost_basis` column yet. Before starting the "Cost basis integrity fix" item above, confirm whether it means reusing/renaming `purchasePrice` (adding a confirmed/estimated flag + a "set once" guard) or adding a new column — the field the item describes doesn't exist in code yet.
- [ ] `lib/api-zod` + `lib/api-spec/openapi.yaml` + `lib/api-client-react` show the app already generates a typed client from an OpenAPI spec for its own API. The same codegen pattern could scaffold the eBay user-OAuth client (token exchange, refresh) instead of hand-rolling it, keeping it consistent with how the rest of the API layer is built.
- [ ] `deals.ts`/`ebay.ts` currently only use app-level (App ID) eBay auth for Finding/Browse API calls — there's no eBay OAuth or sold-listing code anywhere yet, so "Real eBay OAuth" and "Sold-item sync" are both starting from zero, not partially done.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
