# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-26 (daily scheduled check). This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Process problem (unresolved for 5+ weeks)
`main` has had zero commits since 2026-07-20 (last real code commit 07-15) — 41 days now. Every daily check since 07-21 has pushed its findings to a new throwaway `claude/gifted-hopper-*` branch instead of `main`; **30 of these branches now exist, and zero have ever been opened as a PR or merged.** That's why corrections keep getting re-discovered and re-lost run over run — e.g. the "eBay CSV import built" line below was wrong on `main` for 5+ weeks after being corrected on branches starting 08-02. Dallas's own real commit, `gitignore-security-fixes` (2026-08-05, adds `.gitignore` exclusions for `.sql`/`.env`/credential files), is also still sitting unmerged after 21 days.
**Recommendation: merge this branch (`claude/gifted-hopper-9ndms4`) and `gitignore-security-fixes` into `main`, or tell this task to push directly to `main` going forward.**

## 🔴 Security — fix now
- `GET /storage/objects/*path` (`artifacts/api-server/src/routes/storage.ts`) serves private object-storage files with **zero auth or ACL check** — the check is fully written but commented out ("Protected route example — uncomment when using replit-auth"). Anyone who knows or guesses an object path can fetch it. The auth check and `canAccessObjectEntity` helper already exist in the file — this is a ~10-line uncomment-and-wire fix, not new work.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page (`CardTimeline.tsx`) — verified live, wired to real data
- [x] Collection value-over-time chart (`Dashboard.tsx` + `portfolio_snapshots` table) — verified live, wired to real data

## Corrected from prior tracker
- **eBay CSV import — NOT built.** Re-verified directly against the code: no CSV import route exists anywhere in `artifacts/api-server/src/routes`, only CSV *export* on the Collection/Insurance pages. Marked done in error since 07-20.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`routes/collection.ts` ~line 146) unconditionally overwrites `purchasePrice`, `gradingFee`, `shippingFee`, and `otherFees` whenever any is present in the request body, with no "only set once" guard. Confirmed directly in code — this (not CSV re-imports, which don't exist) is the real trigger. Should default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric. `price_history.source` already distinguishes acquired/manual vs. ebay, so the Confirmed/Estimated split is cheaper to build than it sounds.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout. `routes/auth.ts`'s OIDC/PKCE session pattern is a usable template for token storage but isn't itself an eBay OAuth flow.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. No schema groundwork (e.g. `soldAt`/`status` columns) exists yet.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop warning — confirmed real: `Dashboard.tsx` lines 200 and 205 both set `tickFormatter` on the same `<YAxis>` (only line 205's takes effect). Fix is deleting the line-200 duplicate.
- [ ] `POST /cards` has no zod validation at all, unlike every sibling route (`search`, `scan`, get-by-id). Add a `CreateCardBody` schema in `lib/api-zod` and use it.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Collection value over time (sparkline/chart per card) — note: the portfolio-level version already shipped (see Confirmed Complete above); this is the per-card variant
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] No CI workflow and no API rate limiting exist anywhere in the repo
- [ ] `lib/ebay.ts` and `routes/deals.ts` duplicate Finding-API request logic with no shared retry/backoff — a single transient 502/503 permanently fails a price-refresh item for 24h
- [ ] `POST /collection/refresh-prices` duplicates the scheduled price-refresh job's eBay-fetch loop but skips its lock, 600ms throttle, and price_history logging
- [ ] **New:** `POST /cards/scan`'s `.onConflictDoNothing()` can't actually trigger — `cards.id` is a fresh random UUID per insert and the table has no other unique constraint (verified against `lib/db/src/schema/cards.ts`), so this isn't a silent-failure risk as previously logged. The real gap is the opposite: there's no dedup check at all, so scanning the same physical card twice creates two separate `cards` rows. Worth a lookup-before-insert (or a unique constraint on player+year+brand+cardSet+cardNumber) before sold-item sync ships, since duplicate rows would double-count inventory value.
- [ ] **New:** Merge `gitignore-security-fixes` (Dallas's own 08-05 commit) — it's pure prevention (main has no already-tracked `.env`/`.sql` files at risk) and has been sitting ready for 3 weeks.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily

## Investor-Dashboard
This session's GitHub access is scoped to `card-scout` only, so Investor-Dashboard's commit history could not be checked — true for every daily run since 07-21.
