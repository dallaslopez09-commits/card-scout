# Legends & Lunatics — Progress Tracker

_Last updated: 2026-10-09 (daily scheduled check — no new commits on card-scout or Investor-Dashboard in the prior 24h). This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Process problem (unresolved for 11+ weeks)
`main` has had zero commits since 2026-07-20 (last real code commit 07-15) — **81 days now.** Every daily check since 07-21 has pushed its findings to a new throwaway `claude/gifted-hopper-*` branch instead of `main`; **60+ of these branches now exist, and zero have ever been opened as a PR or merged.** This is why corrections keep getting re-discovered and re-lost run over run (e.g. yesterday's run rebuilt the tracker from stale `main` and dropped several findings this run has now re-verified and restored below). Dallas's own real commit, `gitignore-security-fixes` (2026-08-05, adds `.gitignore` exclusions for `.sql`/`.env`/credential files), is also still sitting unmerged after **57 days.**
**Recommendation: merge this branch or `gitignore-security-fixes` into `main`, or tell this task to push directly to `main` going forward.**

## 🔴 Security — fix now
- `GET /storage/objects/*path` (`artifacts/api-server/src/routes/storage.ts`) serves private object-storage files with **zero auth or ACL check** — re-verified directly in code today, lines 139-148: the check and `canAccessObjectEntity` helper are already written but commented out ("Protected route example — uncomment when using replit-auth"). ~10-line uncomment-and-wire fix, not new work.

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page (`CardTimeline.tsx`) — verified live today
- [x] Collection value-over-time chart (`Dashboard.tsx` + `portfolio_snapshots` table) — verified live today

## Corrected from prior tracker
- **eBay CSV import — NOT built in card-scout.** Re-verified today: no CSV import route exists anywhere in `artifacts/api-server/src/routes` or the frontend, only CSV *export* (`Collection.tsx`, `Insurance.tsx`). This has been marked done in error since 07-20; if it shipped anywhere, it was Investor-Dashboard, not this repo. Removing from Confirmed Complete until someone confirms which repo it's actually in.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`routes/collection.ts` line 146) unconditionally overwrites `purchasePrice` (and 151-153 for `gradingFee`/`shippingFee`/`otherFees`) whenever present in the request body, no "only set once" guard. Confirmed again today. Should default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric. `price_history.source` already distinguishes acquired/manual vs. ebay, so the split is cheaper to build than it sounds.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout. `routes/auth.ts`'s OIDC/PKCE session pattern is a usable template for token storage but isn't itself an eBay OAuth flow.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. No schema groundwork (e.g. `soldAt`/`status` columns) exists yet.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop bug — confirmed again today: `Dashboard.tsx` lines 200 and 205 both set `tickFormatter` on the same `<YAxis>` (only line 205's takes effect, line 200 is silently dead). Fix is deleting the line-200 duplicate.
- [ ] `POST /cards` has no zod validation at all, unlike every sibling route (`search`, `scan`, get-by-id). Add a `CreateCardBody` schema in `lib/api-zod` and use it.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time).
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] No CI workflow and no API rate limiting exist anywhere in the repo (0 `*.test.*`/`*.spec.*` files, confirmed again today)
- [ ] Migrate off eBay's Finding API (`lib/ebay.ts`, `routes/deals.ts`) — sunset by eBay Feb 2025; price-refresh job and Deal Finder still call it and may be silently broken in production. Move to Browse API / Marketplace Insights (needs OAuth client-credentials, which would also unblock the real-OAuth item above).
- [ ] `POST /cards/scan`'s `.onConflictDoNothing()` (line 140) can't actually trigger — `cards.id` is a fresh random UUID per insert with no other unique constraint, confirmed again today. The real gap: no dedup check at all, so scanning the same physical card twice creates two rows. Worth a lookup-before-insert (or a unique constraint on player+year+brand+cardSet+cardNumber) before sold-item sync ships, since duplicate rows would double-count inventory value.
- [ ] Merge `gitignore-security-fixes` (Dallas's own 08-05 commit) — pure prevention, has been sitting ready for 54 days.
- [ ] `GET /collection/summary` (`routes/collection.ts` line 40) inserts a new `portfolio_snapshots` row on *every* call, unthrottled — confirmed again today. Should only snapshot on actual value change or at most once per period.
- [ ] Wishlist items have a `targetPrice` field (`routes/wishlist.ts`) that nothing acts on yet. The scheduled price-refresh job already touches eBay pricing on a timer — piggybacking a "current eBay price ≤ targetPrice" check onto that job would give wishlist alerts almost for free.
- [ ] Auth-check logic is duplicated **four** ways now, not two: an identical local `requireAuth(req, res)` helper is copy-pasted verbatim in `collection.ts`, `wishlist.ts`, `sets.ts`, and `portfolio.ts` (confirmed today — `sets.ts` and `portfolio.ts` weren't in the last count), plus a separate `hasAuthenticatedSession` type-guard in `storage.ts` that isn't wired to the private-objects route at all (see security item above).

### New ideas from today's review
- [ ] **Bundle the security fix with the auth consolidation**: `storage.ts` is the one route file with *no* auth check wired, while four others independently duplicate the same `requireAuth` logic. One PR — extract a shared Express auth middleware, apply it everywhere including `storage.ts` — closes the security hole and the 4x duplication at the same time, instead of two separate backlog items competing for the same files.
- [ ] **A minimal CI workflow would have caught the tickFormatter bug for free**: repo has zero CI and zero tests, and the duplicate-`tickFormatter`-prop bug (a silent "second definition wins" React footgun) has now sat live for at least 2 months across two components being touched repeatedly. Typecheck + lint on PR (even without full test coverage) is cheap and would catch this whole class of bug before merge — worth doing before the branch-sprawl problem above is even resolved, since it'll also gate whichever branch eventually merges.
- [ ] **Fold the snapshot-throttling fix into the queued cost-basis PR**: the unthrottled snapshot insert (`collection.ts` line 40) and the cost-basis overwrite bug (`collection.ts` line 146) are both in the same file and the cost-basis fix is already "just sent to Replit" — cheaper to fix both in one pass through this file than to schedule a separate PR that touches the same function again in a few weeks.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily

## Investor-Dashboard
Access was granted this run (repo attached as `dallaslopez09-commits/investor-dashboard`). Commit history for the last 24h (checked 2026-10-09): none. GitHub code search for "csv" returned nothing (flagged incomplete), so it did not settle the question below. Earlier history was not audited in this run, so the CSV-import question above (which repo it actually lives in) is still open — a quick grep of that repo would settle it.
