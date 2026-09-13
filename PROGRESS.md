# Legends & Lunatics — Progress Tracker

_Last updated: 2026-09-13. This file is meant to be updated by the daily scheduled Claude Code task after checking recent commits, and read by Dallas as the source of truth for what's done vs. pending._

**⚠️ Process problem, still unresolved after 7+ weeks:** every scheduled check since 2026-07-21 has committed to its own throwaway `claude/gifted-hopper-*` branch instead of `main`, and no PR is ever opened — **50+ such branches now exist on `card-scout`, zero merged.** `main` itself hasn't had a real code commit since `ff3caf3` (2026-07-15, followed by the PROGRESS.md-adding commit on 2026-07-20) — **60 days with no code merged.** This isn't just losing daily check-in notes: digging through the orphaned branches for this run turned up a 2026-08-24 run that found and fixed several things (correctly flagged the CSV-import claim below as false, cited exact file/line numbers for the cost-basis bug, found 3 more code-grounded ideas) — none of which made it to `main`, so a later run silently reverted the false CSV-import claim back to "confirmed complete." **This run manually recovered that lost analysis** by walking the orphaned branches, but it will happen again tomorrow unless the merge gap is closed. Recommend: either give this task permission to push straight to `main`, or have this task open a PR each run so at least one lands. Either way, someone should merge the most recent good branch (or this one) by hand in the meantime.

**⚠️ Separate stuck item — Dallas's own commit:** `2630f70` ("Add security exclusions to .gitignore: sql, dump, backup, env, credential files"), authored 2026-08-05, is **still unmerged 39 days later** for the same reason (it's sitting on a branch, `main` never advanced). Checked today: no `.sql`/`.dump`/`.backup`/`.env`/credential files are currently tracked in the repo, so nothing is actively leaking, but the safety net isn't in place. Worth cherry-picking onto `main` directly — it's a 30-line, additive-only `.gitignore` change with no code risk.

_Check note (2026-09-13): no new code commits on `card-scout` `main` since 2026-07-20. `Investor-Dashboard` could not be checked this run — this session's GitHub access is scoped to `card-scout` only; its rows below are carried forward unverified from earlier notes._

## Confirmed Complete
- [x] Card Scout pushed to GitHub (`dallaslopez09-commits/card-scout`)
- [x] Investor-Dashboard pushed to GitHub (`dallaslopez09-commits/Investor-Dashboard`)
- [x] eBay production API credentials fixed (App ID / Cert ID auth working)
- [x] Full codebase audits done on both repos (stack, schema, real vs. stubbed features documented)
- [x] Card detail page with price-history chart — `CardTimeline.tsx`, routed at `/collection/:id/timeline`, reads live from `GET /collection/:id/timeline` (`routes/collection.ts`)
- [x] Collection value over time chart — `Dashboard.tsx` (recharts `AreaChart` over `portfolioSnapshotsTable.snapshotDate`), snapshot written on every price refresh and manual edit (`routes/collection.ts`, `priceRefreshJob.ts`)

## Needs Verification
- [ ] **eBay CSV import** — re-checked today, still no CSV import route or file exists anywhere in `card-scout` (`api-server/src/routes/*`, whole-repo search for "csv" — only CSV *export* exists, in `Collection.tsx` / `Insurance.tsx`, plus a presigned-upload endpoint in `storage.ts` that's for card *images*, not inventory data). Either this lives only in Investor-Dashboard (unverifiable this run — out of scope) or the "Confirmed Complete" line is stale. Recommend Dallas confirm before relying on it — this has been mis-reported as done at least twice now on different orphaned branches.

## In Progress / Just Sent to Replit
- [ ] Cost basis integrity fix — root cause confirmed in code: `PUT /collection/:id` (`routes/collection.ts`, ~lines 144-153) unconditionally overwrites `purchasePrice`/`gradingFee`/`shippingFee`/`otherFees` on every edit, no guard against re-setting an already-confirmed value. Should only set each once, default null/unestimated, split Confirmed vs. Estimated profit reporting, add "% inventory with confirmed cost" metric. (Trigger is any edit to the item, not specifically a CSV re-import — see "Needs Verification" above on whether CSV import exists at all.)
- [ ] Real eBay OAuth (user-level, refresh token) — porting the working flow from Investor-Dashboard into Card Scout. Confirmed: `lib/ebay.ts` currently only does app-level auth (`SECURITY-APPNAME` on the legacy Finding API) for comps — no OAuth, no refresh token, anywhere in this repo.
- [ ] Sold-item sync — 24hr auto + manual "Sync Now" button, locks in realized profit/loss at time of sale (never recalculates after), moves sold cards to an archive. Schema still has no `soldAt`/`soldPrice`/`status` columns on `collection_items` — will need adding first; the existing `gradingFee`/`shippingFee`/`otherFees` nullable columns show the pattern to follow.
- [ ] Returns/refunds handled as a manual-review flag, not automatic reversal

## Quick Wins (queued, not yet confirmed done)
- [ ] Deal Finder smoke test in Preview (post eBay Browse API fix)
- [ ] Dashboard `tickFormatter` Vite duplicate-export warning fix

## Backlog / Ideas (not started)
- [ ] **Separate P/L tab** (business-owner view) — realized profit/loss only, Confirmed vs. Estimated split carried through, flagged/pending section for returns awaiting manual adjustment, time-based totals (month/quarter/year/all-time). *Decide: scoped to Card Scout only, or built as the eventual combined view once both apps merge?*
- [ ] eBay sold vs. active price badges
- [ ] Mobile responsiveness audit
- [ ] Empty states (Collection/Wishlist/Sets) — low priority while this stays single-user

## New Ideas (re-verified 2026-09-13 against current code; originally surfaced on an orphaned 2026-08-24 branch that never reached `main`)
- [ ] **`sets.ts` set-completion cost total under-reports vs. the Collection view** — `routes/sets.ts` sums only `purchasePrice` for "cost to complete this set", while `collection.ts`'s portfolio totals and the snapshot job all sum `purchasePrice + gradingFee + shippingFee + otherFees`. Any graded/shipped card shows a cheaper completion cost on the Sets page than its true cost. Worth reconciling alongside the cost-basis fix already queued above.
- [ ] **Wishlist `targetPrice` isn't cross-referenced automatically** — re-checked: it's still only compared client-side, and only after the user manually pulls eBay comps for that specific item (`Wishlist.tsx`); neither the scheduled price-refresh job nor the Deal Finder route touches `targetPrice` at all. Since the refresh job already pulls current eBay prices on a schedule, cross-referencing against `targetPrice` on each tick would give "your wishlist item hit its target" almost for free, without the user having to open the page.
- [ ] **`price_history.note` pattern could back the Confirmed/Estimated cost-basis split** — rows already carry a free-text `note` for provenance (e.g. "eBay median from 8 sold comps"). A similar `costBasisSource` field on `collection_items` would let the UI show *why* a cost is confirmed vs. estimated, not just that it is — useful once the cost-basis fix above lands.

## Deferred / Explicitly Shelved
- Multi-tenant SaaS (paid subscriptions, per-user accounts, Stripe billing) — shelved until the single-user tool is validated and actually used daily
