# Legends & Lunatics — Progress Tracker

_Last updated: 2026-07-30. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Status: main has been stagnant for 2 weeks
No new commits have landed on `card-scout` main since **2026-07-15** (last feature commit `ff3caf3`; `2026-07-20`'s commit only added this file). Every daily scheduled check since then (07-21 through 07-29, 9 runs) has pushed its update to its own throwaway branch and none were ever opened as a PR or merged — they're all still sitting on `origin` unmerged. If work is happening in Replit/elsewhere, it isn't reaching this GitHub repo; if it isn't happening at all, the backlog below hasn't moved in 2 weeks either way. Investor-Dashboard is out of scope for this session's GitHub access, so its activity could not be checked.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`) — *unverified this session (out of scope)*
- [x] eBay production API credentials fixed (App ID / Cert ID auth working) — confirmed: `lib/ebay.ts` uses `EBAY_APP_ID` against the Finding API
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] **Card detail / price history page** — `CardTimeline.tsx` (`/collection/:id/timeline`) already renders a full price-history area chart plus a timestamped activity feed (acquired / manual / eBay-refresh events with deltas), backed by `card_price_history`. Missing only a "comps" list view — otherwise this backlog item is done, not just an idea.
- [x] **Collection value over time** — `Dashboard.tsx` renders an area chart from `GET /portfolio/history`, which reads `portfolio_snapshots` rows written automatically by every price refresh (`priceRefreshJob.ts`, `POST /collection/refresh-prices`) and every `/collection/summary` hit. This is live, not a stub.

## Needs verification
- [ ] **eBay CSV import "auto-updates inventory + current value"** — no CSV *import* route exists anywhere in `card-scout` (checked all of `api-server/src/routes`). The only CSV code found is *export* (`Collection.tsx`, `Insurance.tsx`). Either this feature lives solely in Investor-Dashboard (unverifiable this session) or it never landed in Card Scout — please confirm which.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — schema groundwork already exists (`purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` are already separate columns and `trueCost` is computed from all four in `collection.ts`), but there's still no guard stopping a re-import/edit from silently overwriting `purchasePrice` after the fact, no null/"unestimated" default, and no Confirmed-vs-Estimated split or "% inventory with confirmed cost" metric on top of it
- [ ] Real eBay OAuth (user-level, refresh token) — `routes/auth.ts` already has a working OIDC + refresh-token pattern (`openid-client`, `scope: 'openid email profile offline_access'`, refresh token persisted) that's a ready template to copy for eBay's user-level OAuth; not yet ported
- [ ] Sold-item sync — no `status`/`sold` concept exists anywhere in the schema yet (collection_items has no archive/sold field at all), so this is still at the design stage, not mid-build
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily

## New Ideas (2026-07-30, from direct code read)
- **eBay Finding API is legacy and increasingly restricted** — `fetchEbayComps()` calls `findCompletedItems` on the old Finding API, which eBay has been deprecating in favor of the Browse/Marketplace Insights APIs (sold-listing visibility has been getting cut back for non-partners for a while). This single call powers *both* the price-refresh job and Deal Finder's `soldMedian`, so if it's degraded or shut off, both features silently go dark at once. Worth a live smoke test, and worth checking whether Marketplace Insights API access is worth applying for.
- **"% inventory with confirmed cost" is nearly free right now** — since `card_price_history.source` already tags every price event as `acquired`/`manual`/`ebay`, that metric can be computed today with one query (count items whose only price event is `acquired` vs. items later touched by `manual`/`ebay`) without waiting on the full cost-basis integrity fix.
- **Ship sold-item tracking as manual-entry first, OAuth-sync later** — sold-item sync is blocked on eBay OAuth, but a `status` + `soldPrice` + `soldAt` column on `collection_items` (Dallas manually marks a card sold) would unlock the "Separate P/L tab" and realized-vs-unrealized reporting immediately, using the same lock-in-at-sale-time logic already planned — no need to wait for the eBay OAuth port to start getting value from it.
