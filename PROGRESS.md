# Legends & Lunatics — Progress Tracker

_Last updated: 2026-07-20. Last checked: 2026-08-16 (no new commits on either repo since 2026-07-20; Investor-Dashboard was not accessible from this check — see note below). This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] eBay CSV import built — auto-updates inventory + current value ⚠️ **needs re-verification**: a code audit on 2026-08-16 found no CSV-import route anywhere in card-scout (`artifacts/api-server/src/routes/`) — only CSV *export* in `Collection.tsx`/`Insurance.tsx`, plus a generic object-storage upload endpoint (`storage.ts`) with no CSV parsing. This may only exist in Investor-Dashboard (not checked this run) — worth confirming which repo this item actually refers to.
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — CSV re-imports were overwriting cost_basis; should only set once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix) — ⚠️ premise not yet true: `DealFinder.tsx`/`routes/deals.ts` still call the deprecated `svcs.ebay.com` Finding API via `EBAY_APP_ID` only, not the Browse API. Nothing to smoke-test until the Browse API migration actually lands.
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix — code audit 2026-08-16 found a single clean `recharts` import in `Dashboard.tsx` with no visible duplicate; may already be resolved or was misdiagnosed. Worth a quick manual check in Preview to confirm the warning still fires before spending time on it.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Card detail page (price history chart, comps, eBay link, notes)
- [ ] Collection value over time (sparkline/chart per card)
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user

## Newly Suggested (2026-08-16, from code review — not yet started, not yet discussed with Dallas)
- [ ] **Migrate off the deprecated eBay Finding API now, as one project with OAuth.** Both Deal Finder and collection price-refresh (`lib/ebay.ts`) still call `svcs.ebay.com`'s legacy Finding API via `EBAY_APP_ID` only. Since real eBay OAuth (item already in "In Progress") and the Browse API migration (blocking the Deal Finder quick win) touch the same client code, doing them together avoids building the OAuth flow twice.
- [ ] **Build a shared `sale_events`/transactions table before, not after, cost-basis/sold-sync/returns work.** Cost basis integrity, sold-item sync, and returns-as-manual-review are three separate backlog items that all really need one append-only ledger of buy/sell/return events under the hood. Modeling that table first would let all three be built as views over it instead of three separate ad-hoc mechanisms.
- [ ] **Split PROGRESS.md's "Confirmed Complete" section by repo.** The CSV-import discrepancy above happened because a shared status list doesn't say which repo an item was verified in. Tagging each line `(card-scout)` / `(Investor-Dashboard)` would make future audits catch this kind of drift faster, especially since this session's GitHub access is currently scoped to card-scout only and can't cross-check Investor-Dashboard.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
