import { Router } from "express";
import { db } from "@workspace/db";
import { setGoalsTable, collectionItemsTable, cardsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { formatCard } from "./cards";

const router = Router();

async function requireAuth(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

// GET /sets — list all set goals for the user
router.get("/sets", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;
  const goals = await db
    .select()
    .from(setGoalsTable)
    .where(eq(setGoalsTable.userId, userId))
    .orderBy(setGoalsTable.createdAt);
  res.json(goals.map(formatGoal));
});

// POST /sets — create a new set goal
router.post("/sets", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;
  const { setName, brand, year, sport, totalCards, notes } = req.body;
  if (!setName || !brand) {
    res.status(400).json({ error: "setName and brand are required" });
    return;
  }
  const [goal] = await db
    .insert(setGoalsTable)
    .values({ id: randomUUID(), userId, setName, brand, year: year ?? null, sport: sport ?? null, totalCards: totalCards ?? null, notes: notes ?? null })
    .returning();
  res.status(201).json(formatGoal(goal));
});

// DELETE /sets/:id
router.delete("/sets/:id", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;
  const existing = await db.select().from(setGoalsTable).where(and(eq(setGoalsTable.id, req.params.id), eq(setGoalsTable.userId, userId))).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(setGoalsTable).where(and(eq(setGoalsTable.id, req.params.id), eq(setGoalsTable.userId, userId)));
  res.json({ success: true });
});

// GET /sets/:id/completion — owned cards that match this set
router.get("/sets/:id/completion", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const goal = await db.select().from(setGoalsTable).where(and(eq(setGoalsTable.id, req.params.id), eq(setGoalsTable.userId, userId))).limit(1);
  if (!goal[0]) { res.status(404).json({ error: "Not found" }); return; }
  const g = goal[0];

  // Match collection items where card brand + set match the goal (case-insensitive)
  const allItems = await db
    .select()
    .from(collectionItemsTable)
    .leftJoin(cardsTable, eq(collectionItemsTable.cardId, cardsTable.id))
    .where(eq(collectionItemsTable.userId, userId));

  const owned = allItems.filter(({ cards: card }) => {
    if (!card) return false;
    const brandMatch = card.brand?.toLowerCase() === g.brand.toLowerCase();
    const setMatch = card.cardSet?.toLowerCase() === g.setName.toLowerCase();
    const yearMatch = !g.year || card.year === g.year;
    return brandMatch && setMatch && yearMatch;
  });

  const ownedCount = owned.length;
  const totalCards = g.totalCards ?? null;
  const completionPct = totalCards && totalCards > 0 ? Math.min(100, Math.round((ownedCount / totalCards) * 100)) : null;
  const totalValue = owned.reduce((s, i) => s + Number(i.collection_items.currentValue) * i.collection_items.quantity, 0);
  const totalCost = owned.reduce((s, i) => s + Number(i.collection_items.purchasePrice) * i.collection_items.quantity, 0);

  const ownedCards = owned.map(({ collection_items: item, cards: card }) => ({
    collectionItemId: item.id,
    card: formatCard(card!),
    condition: item.condition,
    currentValue: Number(item.currentValue),
    purchasePrice: Number(item.purchasePrice),
    acquiredAt: item.acquiredAt.toISOString(),
  }));

  res.json({
    goal: formatGoal(g),
    ownedCount,
    totalCards,
    completionPct,
    totalValue,
    totalCost,
    ownedCards,
  });
});

function formatGoal(g: typeof setGoalsTable.$inferSelect) {
  return {
    id: g.id,
    setName: g.setName,
    brand: g.brand,
    year: g.year,
    sport: g.sport,
    totalCards: g.totalCards,
    notes: g.notes,
    createdAt: g.createdAt.toISOString(),
  };
}

export { router as setsRouter };
