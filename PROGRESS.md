# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-13 by the daily scheduled Claude Code check._

## ⚠️ Process note — read this first
Main has been frozen at commit `4891505` (2026-07-20) since this tracker was added; the last real code commit is `ff3caf3` (2026-07-15). Every daily scheduled check since 2026-07-21 (21 runs, gaps on 07-27, 08-08, 08-09, 08-12) has pushed its update to its own throwaway `claude/gifted-hopper-*` branch — **none have ever been merged to main or opened as a PR.** That's why this file kept drifting out of sync with reality: corrections made on 08-02, 08-03, 08-05 etc. never actually landed. This run's update is on `claude/gifted-hopper-piidtw`, same as always — it will stay orphaned too unless one of these branches gets merged or the task is told to open a standing PR.

Also unmerged: `gitignore-security-fixes` (2026-08-05), a real commit from Dallas ("Add security exclusions to .gitignore: sql, dump, backup, env, credential files"). It's pure prevention (verified main has no already-tracked `.env`/`.sql` files) but has been sitting unmerged for 8 days.

Investor-Dashboard could not be checked this run or any prior run — this session's GitHub access is scoped to `card-scout` only.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`) — per original audit; unverifiable this session
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price history page — `CardTimeline.tsx` is live on main
- [x] Portfolio value-over-time chart — `Dashboard.tsx` AreaChart fed by `useGetPortfolioHistory`, live on main

## Corrected — was marked done, isn't
- [ ] ~~eBay CSV import built — auto-updates inventory + current value~~ — **false.** Re-verified directly in code again this run: `Collection.tsx`/`Insurance.tsx` only have CSV *export* (`downloadCsv`), and there's no multer/upload route anywhere in `api-server` that accepts a CSV. This has been flagged on nearly every branch since 08-02 but never corrected on main because those branches never merged. Moved to Backlog as a real to-build item.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`routes/collection.ts` ~line 146) unconditionally overwrites `purchasePrice` with no guard. The same gap applies to `gradingFee`/`shippingFee`/`otherFees` — the fix should cover all four fee fields, not just `purchasePrice`. Note: the cost-basis columns already exist (no schema change needed), and `price_history.source` already distinguishes `acquired`/manual vs `ebay`, so the Confirmed vs. Estimated split is mostly a query change once the overwrite guard is in.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout (unverifiable this session; the existing OIDC/PKCE pattern in `routes/auth.ts` is Replit-specific, not a direct template)
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — still present in both `Dashboard.tsx` and `CardTimeline.tsx`; both hand-roll inline currency/date formatting instead of reusing `formatCurrency`/`formatDate` from `lib/utils.ts`, which is the likely actual cause

## Backlog / Ideas (not started)
- [ ] Build a real CSV import (nothing exists yet — see "Corrected" above)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] **New:** `lib/ebay.ts` and `routes/deals.ts` duplicate eBay Finding API request logic with no shared retry/backoff — a single transient 502/503 permanently fails a price-refresh item for the full 24h window
- [ ] **New:** `POST /collection/refresh-prices` duplicates the eBay-fetch loop from the scheduled refresh job but skips its `isRunning` lock, 600ms throttle, and `price_history` logging — manual refreshes will create silent gaps once the Confirmed/Estimated cost-basis split ships
- [ ] **New:** No CI workflow and no rate limiting exist anywhere in the repo — worth adding before the eBay OAuth / sold-item-sync work lands, since both add more externally-triggered write paths

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
