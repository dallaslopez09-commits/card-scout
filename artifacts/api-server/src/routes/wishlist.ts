import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistItemsTable, cardsTable } from "@workspace/db";
import { AddToWishlistBody, RemoveFromWishlistParams } from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { formatCard } from "./cards";

const router = Router();

async function requireAuth(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// GET /wishlist
router.get("/wishlist", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const items = await db
    .select()
    .from(wishlistItemsTable)
    .leftJoin(cardsTable, eq(wishlistItemsTable.cardId, cardsTable.id))
    .where(eq(wishlistItemsTable.userId, userId))
    .orderBy(desc(wishlistItemsTable.addedAt));

  res.json(
    items.map((i) => ({
      id: i.wishlist_items.id,
      userId: i.wishlist_items.userId,
      cardId: i.wishlist_items.cardId,
      card: formatCard(i.cards!),
      targetPrice: i.wishlist_items.targetPrice ? Number(i.wishlist_items.targetPrice) : null,
      notes: i.wishlist_items.notes,
      addedAt: i.wishlist_items.addedAt.toISOString(),
    }))
  );
});

// POST /wishlist
router.post("/wishlist", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { cardId, targetPrice, notes } = parsed.data;

  // Verify card exists
  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
  if (!card[0]) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const id = randomUUID();
  const [item] = await db
    .insert(wishlistItemsTable)
    .values({
      id,
      userId,
      cardId,
      targetPrice: targetPrice !== undefined ? String(targetPrice) : null,
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json({
    id: item.id,
    userId: item.userId,
    cardId: item.cardId,
    card: formatCard(card[0]),
    targetPrice: item.targetPrice ? Number(item.targetPrice) : null,
    notes: item.notes,
    addedAt: item.addedAt.toISOString(),
  });
});

// DELETE /wishlist/:id
router.delete("/wishlist/:id", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  const parsed = RemoveFromWishlistParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const existing = await db
    .select()
    .from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.id, parsed.data.id), eq(wishlistItemsTable.userId, userId)))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .delete(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.id, parsed.data.id), eq(wishlistItemsTable.userId, userId)));

  res.json({ success: true });
});

export { router as wishlistRouter };
