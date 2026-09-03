# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-03 (daily scheduled check). This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

## ⚠️ Process problem (unresolved for 7+ weeks — read this first)
`main` has had zero commits since 2026-07-20 (last real code commit 07-15) — 45/50 days now. Every daily check since 07-21 has pushed its findings to a new throwaway `claude/gifted-hopper-*` branch instead of `main`; **37+ of these branches now exist, and zero have ever been opened as a PR or merged.** This session is scoped to develop on `claude/gifted-hopper-fn91hz` specifically and is not authorized to push to `main` or merge other branches on its own — that needs Dallas to either merge a branch himself or update the scheduled task's instructions. Until then, expect this section to keep re-appearing. Dallas's own real commit, `gitignore-security-fixes` (2026-08-05, adds `.gitignore` exclusions for `.sql`/`.env`/credential files), is also still sitting unmerged (29 days).

**Recommendation: merge the most recent tracker branch (this run's `claude/gifted-hopper-fn91hz`) and `gitignore-security-fixes` into `main`, or explicitly tell the scheduled task to push straight to `main` going forward.**

No new commits landed on `card-scout` in the last 24 hours (checked all branches, 2026-09-02 13:27 UTC → now — the only activity in that window was yesterday's own tracker-update commit). Code is unchanged, so today's findings are a re-verification carried forward from 09-02, not new discoveries. Re-confirmed directly against source: the storage.ts auth check is still commented out, and the collection.ts cost-basis overwrite still has no guard (both unchanged, see below).

## 🔴 Security — fix now
- `GET /storage/objects/*path` (`artifacts/api-server/src/routes/storage.ts`) serves private object-storage files with **zero auth or ACL check** — the check is fully written but commented out ("Protected route example — uncomment when using replit-auth", lines 139-149). Anyone who knows or guesses an object path can fetch it. The auth check and `canAccessObjectEntity` helper already exist in the file — this is a ~10-line uncomment-and-wire fix, not new work. Known and unfixed since 2026-08-24 (10 days).

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail / price-history page (`CardTimeline.tsx`) — verified live, wired to real data
- [x] Collection value-over-time chart (`Dashboard.tsx` + `portfolio_snapshots` table) — verified live, wired to real data

## Corrected from prior tracker
- **eBay CSV import — NOT built.** No CSV import route exists anywhere in `artifacts/api-server/src/routes`, only CSV *export* on the Collection/Insurance pages. This keeps getting marked done in error whenever a run bases its update on stale `main` instead of the latest accurate branch.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — `PUT /collection/:id` (`routes/collection.ts` line 134, overwrite logic lines 146-153) unconditionally overwrites `purchasePrice`, `gradingFee`, `shippingFee`, and `otherFees` whenever any is present in the request body, with no "only set once" guard. Should default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric. `price_history.source` already distinguishes acquired/manual vs. ebay, so the Confirmed/Estimated split is cheaper to build than it sounds.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout. `routes/auth.ts`'s OIDC/PKCE session pattern is a usable template for token storage but isn't itself an eBay OAuth flow.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. No schema groundwork (e.g. `soldAt`/`status` columns) exists yet.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` duplicate-prop bug — `Dashboard.tsx` lines 200 and 205 both set `tickFormatter` on the same `<YAxis>` (only line 205's takes effect, silently discarding line 200's). Fix is deleting the line-200 duplicate.
- [ ] `POST /cards` has no zod validation at all, unlike every sibling route (`search`, `scan`, get-by-id). Add a `CreateCardBody` schema in `lib/api-zod` and use it.

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] Collection value over time (sparkline/chart per card) — note: the portfolio-level version already shipped (see Confirmed Complete above); this is the per-card variant
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] No CI workflow and no API rate limiting exist anywhere in the repo
- [ ] No test files or test directories exist anywhere in the repo. Given the repo is about to take on cost-basis integrity, sold-item sync, and eBay OAuth (all money-affecting logic), even minimal unit tests around cost-basis calculation and sold-item locking would be worth more than average right now, before those land.
- [ ] `lib/ebay.ts` and `routes/deals.ts` duplicate Finding-API request logic with no shared retry/backoff — a single transient 502/503 permanently fails a price-refresh item for 24h
- [ ] `POST /collection/refresh-prices` duplicates the scheduled price-refresh job's eBay-fetch loop but skips its lock, 600ms throttle, and price_history logging
- [ ] `POST /cards/scan`'s `.onConflictDoNothing()` can't actually trigger — `cards.id` is a fresh random UUID per insert and the table has no other unique constraint. The real gap is the opposite: there's no dedup check at all, so scanning the same physical card twice creates two separate `cards` rows. Worth a lookup-before-insert (or a unique constraint on player+year+brand+cardSet+cardNumber) before sold-item sync ships, since duplicate rows would double-count inventory value.
- [ ] Merge `gitignore-security-fixes` (Dallas's own 08-05 commit) — it's pure prevention (main has no already-tracked `.env`/`.sql` files at risk) and has been sitting ready for 4+ weeks.
- [ ] `GET /collection/summary` inserts a new `portfolio_snapshots` row on *every* call, unthrottled — since `/collection` also silently triggers a background refresh, viewing the dashboard repeatedly can bloat the snapshot table and add noisy, near-duplicate points to the value-over-time chart. Should only snapshot on actual value change or at most once per period.
- [ ] Wishlist items already have a `targetPrice` field (`routes/wishlist.ts`) that nothing currently acts on. The scheduled price-refresh job already touches eBay pricing on a timer — piggybacking a "current eBay price ≤ targetPrice" check onto that same job would give wishlist alerts almost for free, no new integration needed.
- [ ] Auth-check logic is implemented three different ways across routes — a local `requireAuth(req, res)` helper duplicated verbatim in `collection.ts` and `wishlist.ts`, and a separate `hasAuthenticatedSession` type-guard in `storage.ts` that isn't wired to any actual authorization check on the private-objects route (see security item above). Worth consolidating into one shared Express middleware — would also make it harder for a route to accidentally ship with auth commented out the way `storage.ts` did.
- [ ] No lint/CI gate exists to catch bugs like the `tickFormatter` duplicate-prop above — `eslint-plugin-react`'s `react/jsx-no-duplicate-props` rule would flag that exact class of bug at PR time for free.
- [ ] Given the branch-sprawl problem above, have this scheduled task open/update one persistent PR for its tracker updates (or push straight to `main`) instead of creating a brand-new branch every run.
- [ ] Investor-Dashboard reportedly already has a working eBay OAuth flow that Card Scout needs to port (see "In Progress" above), and Card Scout already has auth-check logic duplicated three ways internally. If the two apps are expected to eventually merge (see P/L tab item above), it may be worth extracting eBay auth + the shared-middleware auth check into one small shared package now rather than porting logic twice and de-duplicating it again later.
- [ ] Confirm whether the "In Progress / Just Sent to Replit" items are actually being worked in Replit's private workspace and just not syncing to GitHub — 50 days with zero commits despite four items marked "in progress" is long enough that it's worth checking whether the Replit↔GitHub push integration is still connected, rather than assuming the work simply hasn't started.
- [ ] Given 45 straight days of "no new commits," consider dropping this scheduled check from daily to weekly (or pausing it) until active development resumes — it currently burns a full run every day to re-confirm the same unchanged state.
- [ ] Once a branch is merged, clean up the 37 orphaned `claude/gifted-hopper-*` branches — none of them carry information that isn't now consolidated in this file, and they make the branch list unusable for finding real work.
- [ ] **(New 09-03)** Add a one-line CI/pre-commit guard (a grep step is enough) that fails the build if `storage.ts`'s auth block on the object-storage route stays commented out. The fix has been "known and ready" for 10 days without landing; a hard gate is cheaper than another day of this file re-flagging it.
- [ ] **(New 09-03)** Stop the branch bleeding at the source instead of relying on a future cleanup pass: point the scheduled tracker task at one stable branch name (e.g. reuse `gitignore-security-fixes`, or create `progress-tracker` once) and have it force-push there each run, rather than spawning a fresh `claude/gifted-hopper-*` branch daily.
- [ ] **(New 09-03)** Right now every daily check is half-blind — this session's GitHub scope covers `card-scout` only, so the "Investor-Dashboard already has working eBay OAuth" claim above has never actually been verified against that repo's code, just repeated from earlier notes. Worth extending this scheduled task's access to `Investor-Dashboard` (read-only is enough) so future checks can confirm that OAuth flow directly instead of taking it on faith.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily

## Investor-Dashboard
This session's GitHub access is scoped to `card-scout` only, so Investor-Dashboard's commit history could not be checked — true for every daily run since 07-21.
