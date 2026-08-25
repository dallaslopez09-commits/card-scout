# Legends & Lunatics — Progress Tracker

_Last updated: 2026-08-25. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

**⚠️ Process problem, still unresolved after 5 weeks:** every daily check since 2026-07-21 has committed to its own throwaway `claude/gifted-hopper-*` branch instead of `main` — **30 such branches exist as of yesterday (31 after today's), zero PRs ever opened, zero merges.** That's why `main`'s copy of this file sat dated 2026-07-20 for over a month even as corrected findings piled up on orphaned branches. Separately, Dallas's own commit `gitignore-security-fixes` (2630f70, 2026-08-05 — security exclusions for `.sql`/`.dump`/`.backup`/`.env`/credential files) has been sitting unmerged for **20 days**. Recommend either giving this task permission to push straight to `main`, or merging `gitignore-security-fixes` and one of the recent `claude/gifted-hopper-*` branches by hand.

_Check note (2026-08-25): no new commits on `card-scout` `main` in the last 24h (still at `4891505` from 2026-07-20; last real code commit `ff3caf3`, 2026-07-15 — 41 days). This session's GitHub access is scoped to `card-scout` only, so `Investor-Dashboard` commit history could not be checked this run; its row below is carried forward unverified._

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail page with price-history chart — `CardTimeline.tsx` (250 lines), routed at `/collection/:id/timeline`, reads live from `GET /collection/:id/timeline` (`routes/collection.ts:171`)
- [x] Collection value over time chart — `Dashboard.tsx` (recharts `AreaChart` over `portfolioSnapshotsTable.snapshotDate`), snapshot written on every refresh and manual edit (`routes/collection.ts:40,83`, `priceRefreshJob.ts:148`)

## Needs Verification
- [ ] **eBay CSV import** — no CSV import route or file exists anywhere in `card-scout` (checked `api-server/src/routes/*`, whole-repo grep for "csv" — only CSV *export* exists, in `Collection.tsx`/`Insurance.tsx`). Either this lives only in Investor-Dashboard (unverifiable this run — out of scope) or the line is stale; recommend Dallas confirm before relying on it.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — root cause confirmed: `PUT /collection/:id` (`routes/collection.ts` lines ~146-153) unconditionally overwrites `purchasePrice`/`gradingFee`/`shippingFee`/`otherFees` on every edit, no guard. (Note: trigger is the manual-edit form, not CSV re-import — see "Needs Verification" above.) Should only set each once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric.
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. Schema still has no `isSold`/`soldAt`/`salePrice` columns — will need adding first; `gradingFee`/`shippingFee`/`otherFees` (nullable, added alongside `purchasePrice`) show the pattern to follow.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user
- [ ] **`sets.ts` set-completion cost total under-reports vs. Collection view** — `routes/sets.ts:81` sums only `purchasePrice`, while `collection.ts`'s portfolio totals (and the snapshot job) sum `purchasePrice + gradingFee + shippingFee + otherFees` (`routes/collection.ts:27,82`, `priceRefreshJob.ts:138`). Any card with fees shows a cheaper "cost to complete this set" than its true cost. Worth reconciling alongside the cost-basis fix already queued.
- [ ] **Wishlist `targetPrice` is stored but never used** — `wishlistItemsTable.targetPrice` is set/returned by `routes/wishlist.ts`, but nothing compares it against live prices. The price-refresh job and Deal Finder already pull current eBay prices on a schedule; cross-referencing against `targetPrice` on each tick would surface "your wishlist item hit its target" almost for free.
- [ ] **`price_history.note` pattern could back the Confirmed/Estimated cost-basis split** — rows already carry a free-text `note` for provenance (e.g. "eBay median from 8 sold comps"). A similar `costBasisSource` field on `collection_items` would let the UI show *why* a cost is confirmed vs. estimated, not just that it is — useful once the cost-basis fix above lands.

## New Ideas (from 2026-08-25 code check)
- [ ] **Object storage private-file route has its auth/ACL check commented out** — `routes/storage.ts` `GET /storage/objects/*path` (lines 139-152) has the entire authentication + `ObjectPermission.READ` ACL check commented out as "Protected route example ... uncomment when using replit-auth." Right now anyone who knows or guesses an object path can fetch it — no session check at all. Worth fixing in the same pass as `gitignore-security-fixes`, since both are about not leaking things that shouldn't be public. The sibling `/storage/public-objects/*` route is intentionally public and is fine as-is.
- [ ] **`POST /cards` (manual card creation) skips the zod validation every other card route uses** — `cards/search`, `cards/scan`, and `GET /cards/:id` all validate through `@workspace/api-zod` schemas (`SearchCardsQueryParams`, `ScanCardBody`, `GetCardParams`), but `POST /cards` (`routes/cards.ts:36`) just destructures `req.body` directly and only checks that `sport`/`brand`/`cardSet` are truthy — no type or range checks on `year`, `estimatedValue`, etc. Adding a `CreateCardBody` schema would close the gap and match the pattern already established.
- [ ] **`POST /cards/scan` can return a card that was never actually saved** — it inserts with `.onConflictDoNothing()` (`routes/cards.ts:140`) but then always responds with the locally-built `card` object via `formatCard()`, not what's actually in the DB. If a conflict silently no-ops the insert (e.g. a rescan of a card that already exists), the response still claims success with data that may not match the stored row. Should re-select the row post-insert, or return the existing row's ID when the insert is skipped.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
