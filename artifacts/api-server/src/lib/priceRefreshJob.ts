/**
 * Background eBay price refresh job.
 *
 * - Runs on a configurable interval (default 6 h).
 * - On each tick it finds every collection item whose ebay_checked_at is NULL
 *   or older than STALE_HOURS, then calls the eBay Finding API for each one
 *   and writes the result back to the DB.
 * - Adds a 500 ms delay between cards so we don't hammer the eBay API.
 * - Exposes getRefreshStatus() so the /collection/refresh-status route can
 *   tell the frontend what's happening.
 */

import { db } from "@workspace/db";
import { collectionItemsTable, cardsTable, portfolioSnapshotsTable } from "@workspace/db";
import { eq, or, lt, isNull, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { fetchEbayComps } from "./ebay";
import { logger } from "./logger";

const STALE_HOURS = 24;          // treat item as stale after this many hours
const INTERVAL_MS = 6 * 60 * 60 * 1000; // how often the job fires
const DELAY_BETWEEN_CARDS_MS = 600;      // pause between eBay calls

export interface RefreshStatus {
  isRunning: boolean;
  lastRunAt: string | null;   // ISO timestamp
  nextRunAt: string | null;   // ISO timestamp
  lastResult: { updated: number; failed: number; total: number } | null;
}

let isRunning = false;
let lastRunAt: Date | null = null;
let nextRunAt: Date | null = null;
let lastResult: RefreshStatus["lastResult"] = null;
let jobTimer: ReturnType<typeof setTimeout> | null = null;

export function getRefreshStatus(): RefreshStatus {
  return {
    isRunning,
    lastRunAt: lastRunAt?.toISOString() ?? null,
    nextRunAt: nextRunAt?.toISOString() ?? null,
    lastResult,
  };
}

/** Delay helper */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Refresh all stale items across every user. */
export async function refreshStaleItems(olderThanHours = STALE_HOURS): Promise<{ updated: number; failed: number; total: number }> {
  if (isRunning) {
    logger.info("Price refresh already in progress — skipping");
    return { updated: 0, failed: 0, total: 0 };
  }

  isRunning = true;
  const start = Date.now();
  let updated = 0;
  let failed = 0;

  try {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    // Find stale items (never checked OR checked before cutoff)
    const staleItems = await db
      .select()
      .from(collectionItemsTable)
      .leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id))
      .where(
        or(
          isNull(collectionItemsTable.ebayCheckedAt),
          lt(collectionItemsTable.ebayCheckedAt, cutoff),
        ),
      );

    const total = staleItems.length;
    logger.info({ total, olderThanHours }, "Starting eBay price refresh");

    const now = new Date();

    for (const { collection_items: item, cards: card } of staleItems) {
      if (!card) continue;
      try {
        const result = await fetchEbayComps(card);
        const price = result.medianPrice ?? result.averagePrice;

        if (price && price > 0) {
          await db
            .update(collectionItemsTable)
            .set({
              currentValue: String(price),
              ebayPrice: String(price),
              ebayCheckedAt: now,
              ebayListingUrl: result.comps[0]?.listingUrl ?? null,
              updatedAt: now,
            })
            .where(eq(collectionItemsTable.id, item.id));
          updated++;
        } else {
          // Still mark as checked so we don't hammer eBay for cards with no listings
          await db
            .update(collectionItemsTable)
            .set({ ebayCheckedAt: now, updatedAt: now })
            .where(eq(collectionItemsTable.id, item.id));
          failed++;
        }
      } catch (err) {
        logger.warn({ err, cardId: card.id, itemId: item.id }, "eBay refresh failed for item");
        failed++;
      }

      await sleep(DELAY_BETWEEN_CARDS_MS);
    }

    // Save a portfolio snapshot per user after the refresh
    if (updated > 0) {
      const userIds = [...new Set(staleItems.map((i) => i.collection_items.userId))];
      for (const userId of userIds) {
        const userItems = await db
          .select()
          .from(collectionItemsTable)
          .where(eq(collectionItemsTable.userId, userId));

        const totalValue = userItems.reduce((s, i) => s + Number(i.currentValue) * i.quantity, 0);
        const totalCost = userItems.reduce(
          (s, i) =>
            s +
            (Number(i.purchasePrice) +
              Number(i.gradingFee) +
              Number(i.shippingFee) +
              Number(i.otherFees)) *
              i.quantity,
          0,
        );
        await db.insert(portfolioSnapshotsTable).values({
          id: randomUUID(),
          userId,
          totalValue: String(totalValue),
          totalCost: String(totalCost),
        });
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.info({ updated, failed, total, elapsed }, "eBay price refresh complete");

    return { updated, failed, total };
  } finally {
    isRunning = false;
    lastRunAt = new Date();
    lastResult = { updated, failed, total: updated + failed };
  }
}

/** Trigger a background refresh for a specific user's stale items (non-blocking). */
export function triggerUserRefreshIfStale(userId: string, olderThanHours = STALE_HOURS): void {
  // Fire-and-forget — don't await
  (async () => {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const stale = await db
      .select({ id: collectionItemsTable.id })
      .from(collectionItemsTable)
      .where(
        and(
          eq(collectionItemsTable.userId, userId),
          or(
            isNull(collectionItemsTable.ebayCheckedAt),
            lt(collectionItemsTable.ebayCheckedAt, cutoff),
          ),
        ),
      )
      .limit(1);

    if (stale.length > 0 && !isRunning) {
      logger.info({ userId }, "Auto-triggering eBay refresh for stale user items");
      await refreshStaleItems(olderThanHours);
    }
  })().catch((err) => logger.warn({ err }, "Auto-refresh error"));
}

/** Start the recurring background job. Call once at server startup. */
export function startPriceRefreshJob(): void {
  const tick = async () => {
    try {
      const result = await refreshStaleItems();
      lastResult = result;
    } catch (err) {
      logger.error({ err }, "Background price refresh job error");
    }
    // Schedule the next run
    nextRunAt = new Date(Date.now() + INTERVAL_MS);
    jobTimer = setTimeout(tick, INTERVAL_MS);
  };

  // Run first tick after 60 s so server has time to fully start,
  // then every INTERVAL_MS thereafter.
  nextRunAt = new Date(Date.now() + 60_000);
  jobTimer = setTimeout(tick, 60_000);
  logger.info({ intervalHours: INTERVAL_MS / 3_600_000 }, "eBay price refresh job scheduled");
}
