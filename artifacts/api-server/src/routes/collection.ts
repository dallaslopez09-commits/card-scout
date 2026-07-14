import { Router } from "express";
import { db } from "@workspace/db";
import { collectionItemsTable, cardsTable } from "@workspace/db";
import { AddToCollectionBody, UpdateCollectionItemBody, UpdateCollectionItemParams, RemoveFromCollectionParams } from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { formatCard } from "./cards";
import { portfolioSnapshotsTable } from "@workspace/db";
import { fetchEbayComps } from "../lib/ebay";
import { logger } from "../lib/logger";

const router = Router();

async function requireAuth(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

// GET /collection/summary
router.get("/collection/summary", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const items = await db.select().from(collectionItemsTable).leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id)).where(eq(collectionItemsTable.userId, userId));

  const totalCost = items.reduce((s, i) => s + (Number(i.collection_items.purchasePrice) + Number(i.collection_items.gradingFee) + Number(i.collection_items.shippingFee) + Number(i.collection_items.otherFees)) * i.collection_items.quantity, 0);
  const totalValue = items.reduce((s, i) => s + Number(i.collection_items.currentValue) * i.collection_items.quantity, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  let topGainer = null, topLoser = null;
  if (items.length > 0) {
    const withGain = items.map((i) => ({ item: i, gain: Number(i.collection_items.currentValue) - Number(i.collection_items.purchasePrice) }));
    const sorted = [...withGain].sort((a, b) => b.gain - a.gain);
    topGainer = sorted[0] ? formatItem(sorted[0].item.collection_items, sorted[0].item.cards!) : null;
    topLoser = sorted[sorted.length - 1]?.gain < 0 ? formatItem(sorted[sorted.length - 1].item.collection_items, sorted[sorted.length - 1].item.cards!) : null;
  }

  await db.insert(portfolioSnapshotsTable).values({ id: randomUUID(), userId, totalValue: String(totalValue), totalCost: String(totalCost) });
  res.json({ totalValue, totalCost, totalGain, totalGainPercent, itemCount: items.length, topGainer, topLoser });
});

// POST /collection/refresh-prices — bulk eBay refresh
router.post("/collection/refresh-prices", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const items = await db.select().from(collectionItemsTable).leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id)).where(eq(collectionItemsTable.userId, userId));

  if (items.length === 0) { res.json({ updated: 0, failed: 0 }); return; }

  let updated = 0, failed = 0;
  const now = new Date();

  for (const { collection_items: item, cards: card } of items) {
    if (!card) continue;
    try {
      const result = await fetchEbayComps(card);
      const price = result.medianPrice ?? result.averagePrice;
      if (price && price > 0) {
        await db.update(collectionItemsTable).set({
          currentValue: String(price),
          ebayPrice: String(price),
          ebayCheckedAt: now,
          ebayListingUrl: result.comps[0]?.listingUrl ?? null,
          updatedAt: now,
        }).where(and(eq(collectionItemsTable.id, item.id), eq(collectionItemsTable.userId, userId)));
        updated++;
      } else {
        failed++;
      }
    } catch (err) {
      logger.warn({ err, cardId: card.id }, "eBay refresh failed for card");
      failed++;
    }
  }

  // Save snapshot after refresh
  const refreshedItems = await db.select().from(collectionItemsTable).where(eq(collectionItemsTable.userId, userId));
  const totalValue = refreshedItems.reduce((s, i) => s + Number(i.currentValue) * i.quantity, 0);
  const totalCost = refreshedItems.reduce((s, i) => s + (Number(i.purchasePrice) + Number(i.gradingFee) + Number(i.shippingFee) + Number(i.otherFees)) * i.quantity, 0);
  await db.insert(portfolioSnapshotsTable).values({ id: randomUUID(), userId, totalValue: String(totalValue), totalCost: String(totalCost) });

  res.json({ updated, failed, total: items.length });
});

// GET /collection
router.get("/collection", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;
  const items = await db.select().from(collectionItemsTable).leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id)).where(eq(collectionItemsTable.userId, userId)).orderBy(desc(collectionItemsTable.acquiredAt));
  res.json(items.map((i) => formatItem(i.collection_items, i.cards!)));
});

// POST /collection
router.post("/collection", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const parsed = AddToCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { cardId, purchasePrice, quantity = 1, condition, notes } = parsed.data;
  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
  if (!card[0]) { res.status(404).json({ error: "Card not found" }); return; }

  const [item] = await db.insert(collectionItemsTable).values({
    id: randomUUID(), userId, cardId, purchasePrice: String(purchasePrice), currentValue: card[0].estimatedValue,
    quantity, condition: condition ?? null, notes: notes ?? null,
    gradingFee: "0", shippingFee: "0", otherFees: "0",
  }).returning();

  res.status(201).json(formatItem(item, card[0]));
});

// PUT /collection/:id
router.put("/collection/:id", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const paramParsed = UpdateCollectionItemParams.safeParse(req.params);
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const existing = await db.select().from(collectionItemsTable).where(and(eq(collectionItemsTable.id, paramParsed.data.id), eq(collectionItemsTable.userId, userId))).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  const body = req.body;
  const update: Partial<typeof collectionItemsTable.$inferInsert> = { updatedAt: new Date() };
  if (body.purchasePrice !== undefined) update.purchasePrice = String(body.purchasePrice);
  if (body.currentValue !== undefined) update.currentValue = String(body.currentValue);
  if (body.quantity !== undefined) update.quantity = body.quantity;
  if (body.condition !== undefined) update.condition = body.condition;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.gradingFee !== undefined) update.gradingFee = String(body.gradingFee);
  if (body.shippingFee !== undefined) update.shippingFee = String(body.shippingFee);
  if (body.otherFees !== undefined) update.otherFees = String(body.otherFees);
  if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl;

  const [updated] = await db.update(collectionItemsTable).set(update).where(and(eq(collectionItemsTable.id, paramParsed.data.id), eq(collectionItemsTable.userId, userId))).returning();
  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, updated.cardId)).limit(1);
  res.json(formatItem(updated, card[0]!));
});

// DELETE /collection/:id
router.delete("/collection/:id", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const parsed = RemoveFromCollectionParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const existing = await db.select().from(collectionItemsTable).where(and(eq(collectionItemsTable.id, parsed.data.id), eq(collectionItemsTable.userId, userId))).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(collectionItemsTable).where(and(eq(collectionItemsTable.id, parsed.data.id), eq(collectionItemsTable.userId, userId)));
  res.json({ success: true });
});

function formatItem(item: typeof collectionItemsTable.$inferSelect, card: typeof cardsTable.$inferSelect) {
  const trueCost = Number(item.purchasePrice) + Number(item.gradingFee) + Number(item.shippingFee) + Number(item.otherFees);
  return {
    id: item.id, userId: item.userId, cardId: item.cardId,
    card: formatCard(card),
    purchasePrice: Number(item.purchasePrice),
    currentValue: Number(item.currentValue),
    quantity: item.quantity,
    condition: item.condition,
    notes: item.notes,
    gradingFee: Number(item.gradingFee),
    shippingFee: Number(item.shippingFee),
    otherFees: Number(item.otherFees),
    trueCost,
    ebayPrice: item.ebayPrice ? Number(item.ebayPrice) : null,
    ebayCheckedAt: item.ebayCheckedAt?.toISOString() ?? null,
    ebayListingUrl: item.ebayListingUrl ?? null,
    imageUrl: item.imageUrl ?? null,
    acquiredAt: item.acquiredAt.toISOString(),
  };
}

export { router as collectionRouter };
