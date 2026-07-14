import { Router } from "express";
import { db } from "@workspace/db";
import { collectionItemsTable, cardsTable } from "@workspace/db";
import {
  AddToCollectionBody,
  UpdateCollectionItemBody,
  UpdateCollectionItemParams,
  RemoveFromCollectionParams,
} from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { formatCard } from "./cards";
import { portfolioSnapshotsTable } from "@workspace/db";

const router = Router();

async function requireAuth(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// GET /collection/summary - must be before /collection/:id
router.get("/collection/summary", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const items = await db
    .select()
    .from(collectionItemsTable)
    .leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id))
    .where(eq(collectionItemsTable.userId, userId));

  const totalCost = items.reduce((sum, i) => sum + Number(i.collection_items.purchasePrice) * i.collection_items.quantity, 0);
  const totalValue = items.reduce((sum, i) => sum + Number(i.collection_items.currentValue) * i.collection_items.quantity, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  let topGainer = null;
  let topLoser = null;

  if (items.length > 0) {
    const withGain = items.map((i) => ({
      item: i,
      gain: Number(i.collection_items.currentValue) - Number(i.collection_items.purchasePrice),
    }));
    const sorted = [...withGain].sort((a, b) => b.gain - a.gain);
    topGainer = sorted[0] ? formatCollectionItem(sorted[0].item.collection_items, sorted[0].item.cards!) : null;
    topLoser = sorted[sorted.length - 1] && sorted[sorted.length - 1].gain < 0
      ? formatCollectionItem(sorted[sorted.length - 1].item.collection_items, sorted[sorted.length - 1].item.cards!)
      : null;
  }

  // Save snapshot
  await db.insert(portfolioSnapshotsTable).values({
    id: randomUUID(),
    userId,
    totalValue: String(totalValue),
    totalCost: String(totalCost),
  });

  res.json({ totalValue, totalCost, totalGain, totalGainPercent, itemCount: items.length, topGainer, topLoser });
});

// GET /collection
router.get("/collection", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const items = await db
    .select()
    .from(collectionItemsTable)
    .leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id))
    .where(eq(collectionItemsTable.userId, userId))
    .orderBy(desc(collectionItemsTable.acquiredAt));

  res.json(items.map((i) => formatCollectionItem(i.collection_items, i.cards!)));
});

// POST /collection
router.post("/collection", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const parsed = AddToCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { cardId, purchasePrice, quantity = 1, condition, notes } = parsed.data;

  // Verify card exists
  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
  if (!card[0]) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const id = randomUUID();
  const [item] = await db
    .insert(collectionItemsTable)
    .values({
      id,
      userId,
      cardId,
      purchasePrice: String(purchasePrice),
      currentValue: card[0].estimatedValue,
      quantity,
      condition: condition ?? null,
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json(formatCollectionItem(item, card[0]));
});

// PUT /collection/:id
router.put("/collection/:id", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const paramParsed = UpdateCollectionItemParams.safeParse(req.params);
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateCollectionItemBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const existing = await db
    .select()
    .from(collectionItemsTable)
    .where(and(eq(collectionItemsTable.id, paramParsed.data.id), eq(collectionItemsTable.userId, userId)))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Collection item not found" });
    return;
  }

  const update: Partial<typeof collectionItemsTable.$inferInsert> = { updatedAt: new Date() };
  const body = bodyParsed.data;
  if (body.purchasePrice !== undefined) update.purchasePrice = String(body.purchasePrice);
  if (body.currentValue !== undefined) update.currentValue = String(body.currentValue);
  if (body.quantity !== undefined) update.quantity = body.quantity;
  if (body.condition !== undefined) update.condition = body.condition;
  if (body.notes !== undefined) update.notes = body.notes;

  const [updated] = await db
    .update(collectionItemsTable)
    .set(update)
    .where(and(eq(collectionItemsTable.id, paramParsed.data.id), eq(collectionItemsTable.userId, userId)))
    .returning();

  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, updated.cardId)).limit(1);

  res.json(formatCollectionItem(updated, card[0]!));
});

// DELETE /collection/:id
router.delete("/collection/:id", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const parsed = RemoveFromCollectionParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const existing = await db
    .select()
    .from(collectionItemsTable)
    .where(and(eq(collectionItemsTable.id, parsed.data.id), eq(collectionItemsTable.userId, userId)))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .delete(collectionItemsTable)
    .where(and(eq(collectionItemsTable.id, parsed.data.id), eq(collectionItemsTable.userId, userId)));

  res.json({ success: true });
});

function formatCollectionItem(
  item: typeof collectionItemsTable.$inferSelect,
  card: typeof cardsTable.$inferSelect,
) {
  return {
    id: item.id,
    userId: item.userId,
    cardId: item.cardId,
    card: formatCard(card),
    purchasePrice: Number(item.purchasePrice),
    currentValue: Number(item.currentValue),
    quantity: item.quantity,
    condition: item.condition,
    notes: item.notes,
    acquiredAt: item.acquiredAt.toISOString(),
  };
}

export { router as collectionRouter };
