# Legends & Lunatics — Progress Tracker

_Last updated: 2026-07-31. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Status: main has been stagnant for 2+ weeks, and these updates aren't reaching it
No new commits have landed on `card-scout` main since **2026-07-15** (last feature commit `ff3caf3`; the `2026-07-20` commit only added this file). Every daily scheduled check since then (07-21 through 07-30, 10 runs) has pushed its update to its own throwaway branch — none were ever opened as a PR or merged. They're all still sitting on `origin` unmerged, so **this file on `main` has been showing 07-20-era information for 11 days** even though 10 days of accumulated findings exist on abandoned branches. This run reconstructs the tracker from the most recent orphan (`claude/gifted-hopper-aruf9a`, 07-30) so nothing already found gets lost again. Investor-Dashboard remains out of scope for this session's GitHub access, so its activity could not be checked.

**Recommended fix:** either tell this task to open a PR when it has something worth merging, or manually merge one of the orphaned `claude/gifted-hopper-*` branches into `main` so this tracker stops resetting to stale info on every fresh session.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`) — *unverified this session (out of scope)*
- [x] eBay production API credentials fixed (App ID / Cert ID auth working) — confirmed: `lib/ebay.ts` uses `EBAY_APP_ID` against the Finding API
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] **Card detail / price history page** — `CardTimeline.tsx` (`/collection/:id/timeline`) renders a full price-history area chart plus a timestamped activity feed (acquired / manual / eBay-refresh events with deltas), backed by `card_price_history`. Missing only a "comps" list view — otherwise done.
- [x] **Collection value over time** — `Dashboard.tsx` renders an area chart from `GET /portfolio/history`, reading `portfolio_snapshots` rows written automatically by every price refresh (`priceRefreshJob.ts`, `POST /collection/refresh-prices`) and every `/collection/summary` hit. Live, not a stub.
- [x] **Price-refresh throttling** — `priceRefreshJob.ts` already waits 600ms between per-card eBay calls specifically to avoid hammering the API; this was previously an open question and is now confirmed handled.

## Needs verification
- [ ] **eBay CSV import "auto-updates inventory + current value"** — no CSV *import* route exists anywhere in `card-scout` (checked all of `api-server/src/routes`). The only CSV code found is *export* (`Collection.tsx`, `Insurance.tsx`). Either this feature lives solely in Investor-Dashboard (unverifiable this session) or it never landed in Card Scout — please confirm which.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — schema groundwork already exists (`purchasePrice`, `gradingFee`, `shippingFee`, `otherFees` are separate columns and `trueCost` is computed from all four in `collection.ts`), but there's still no guard stopping a re-import/edit from silently overwriting `purchasePrice`, no null/"unestimated" default, and no Confirmed-vs-Estimated split or "% inventory with confirmed cost" metric on top of it. Also still unresolved: whether `purchasePrice` is meant as per-unit or per-line-total when `quantity` > 1 — `priceRefreshJob.ts` multiplies `(purchasePrice + fees) * quantity`, so this needs to be nailed down before the cost-basis math can be trusted.
- [ ] Real eBay OAuth (user-level, refresh token) — `routes/auth.ts` already has a working OIDC + refresh-token pattern (`openid-client`, `scope: 'openid email profile offline_access'`, refresh token persisted) that's a ready template to copy; not yet ported
- [ ] Sold-item sync — no `status`/`sold` concept exists anywhere in the schema yet (`collection_items` has no archive/sold field at all), so this is still at the design stage
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] Wishlist ↔ Deal Finder cross-link (search Deal Finder directly from a Wishlist item) — checked `routes/deals.ts` again this run, still no wishlist reference in it
- [ ] Surface price-refresh timestamp/failures in the UI (last-checked age, failed count) rather than only in server logs
- [ ] Migrate off the legacy eBay Finding API to Browse/Marketplace Insights before it's cut back further for non-partners — affects both `lib/ebay.ts` (comps) and `routes/deals.ts` (active listings + sold median)
- [ ] Add test coverage for the eBay integration paths (comps, deals, price refresh) — none found in this pass
- [ ] Review secrets handling (`EBAY_APP_ID` etc.) ahead of adding eBay OAuth client secrets/refresh tokens
- [ ] A "next up" pointer at the top of this file so each daily run (and Dallas) knows what to tackle first instead of re-deriving priority from scratch
- [ ] Decide the long-term Card Scout ↔ Investor-Dashboard relationship (merge, or stay separate with a shared library)
- [ ] "% inventory with confirmed cost" metric — nearly free to add now since `card_price_history.source` already tags every price event as `acquired`/`manual`/`ebay`
- [ ] Ship sold-item tracking as manual-entry first (a `status`/`soldPrice`/`soldAt` column Dallas sets by hand) ahead of the full eBay OAuth-based sync, to start getting P/L value sooner
- [ ] **New:** Add retry-with-backoff for transient eBay errors (502/503) — right now a single transient failure in `priceRefreshJob.ts` just marks the item "failed" and waits 24h for the next cycle; `routes/deals.ts` already has friendlier 502/503 messaging than `lib/ebay.ts` does, so a shared client with 1–2 retries would fix both the UX gap and the missed-recoveries
- [ ] **New:** Unify `lib/ebay.ts` and `routes/deals.ts` into one eBay client module — they duplicate the Finding API request-building and sold-median logic independently, so the coming Finding→Browse API migration would otherwise need to happen twice

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
