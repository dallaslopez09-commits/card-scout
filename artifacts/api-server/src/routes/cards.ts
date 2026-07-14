import { Router } from "express";
import { db } from "@workspace/db";
import { cardsTable } from "@workspace/db";
import { SearchCardsQueryParams, ScanCardBody, GetCardParams } from "@workspace/api-zod";
import { eq, ilike, and, sql, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

const router = Router();

// GET /cards/search
router.get("/cards/search", async (req, res) => {
  const parsed = SearchCardsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { q, sport, year, brand, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        ilike(cardsTable.name, `%${q}%`),
        ilike(cardsTable.player, `%${q}%`),
        ilike(cardsTable.cardSet, `%${q}%`),
      )
    );
  }
  if (sport) conditions.push(ilike(cardsTable.sport, `%${sport}%`));
  if (year) conditions.push(eq(cardsTable.year, year));
  if (brand) conditions.push(ilike(cardsTable.brand, `%${brand}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [cards, countResult] = await Promise.all([
    db.select().from(cardsTable).where(where).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(cardsTable).where(where),
  ]);

  res.json({
    cards: cards.map(formatCard),
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
  });
});

// POST /cards/scan - AI-powered card identification
router.post("/cards/scan", async (req, res) => {
  const parsed = ScanCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { imageBase64, mimeType = "image/jpeg" } = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(400).json({ error: "Anthropic API key not configured" });
    return;
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are an expert sports card identifier. Analyze this sports card image and extract:
1. Player name
2. Card year (e.g. 1989, 2021)
3. Brand/manufacturer (e.g. Topps, Panini, Upper Deck, Bowman)
4. Card set name
5. Card number (if visible)
6. Sport (Baseball, Basketball, Football, Hockey, Soccer)
7. Whether it's a rookie card (true/false)
8. Whether it's serial numbered (true/false)
9. Estimated market value in USD (realistic current market value)
10. Brief description

Respond with ONLY valid JSON in this format:
{
  "identified": true,
  "player": "Player Name",
  "year": 1989,
  "brand": "Topps",
  "cardSet": "Set Name",
  "cardNumber": "#123",
  "sport": "Baseball",
  "rookieCard": false,
  "serialNumbered": false,
  "estimatedValue": 25.00,
  "condition": "Near Mint",
  "description": "Brief description",
  "confidence": "high",
  "notes": "Any additional notes"
}

If you cannot identify the card clearly, set "identified": false and fill in what you can.`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);

    // Try to find an existing matching card or create a new one
    const cardId = randomUUID();
    const cardName = result.player
      ? `${result.year ?? ""} ${result.brand ?? ""} ${result.player} ${result.rookieCard ? "RC" : ""}`.trim()
      : "Unknown Card";

    const card = {
      id: cardId,
      name: cardName,
      player: result.player ?? null,
      sport: result.sport ?? "",
      year: result.year ?? null,
      brand: result.brand ?? "",
      cardSet: result.cardSet ?? "",
      cardNumber: result.cardNumber ?? null,
      imageUrl: null,
      estimatedValue: String(result.estimatedValue ?? 0),
      condition: result.condition ?? null,
      rookieCard: result.rookieCard ?? false,
      serialNumbered: result.serialNumbered ?? false,
      description: result.description ?? null,
    };

    // Save to DB so it can be added to collection/wishlist
    await db.insert(cardsTable).values(card).onConflictDoNothing();

    res.json({
      identified: result.identified !== false,
      card: formatCard(card as any),
      confidence: result.confidence ?? null,
      notes: result.notes ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Card scan failed");
    res.status(500).json({ error: "Card identification failed. Please try again." });
  }
});

// POST /cards — manual card creation
router.post("/cards", async (req, res) => {
  const { player, sport, year, brand, cardSet, cardNumber, estimatedValue, condition, rookieCard, serialNumbered, description } = req.body;

  if (!sport || !brand || !cardSet) {
    res.status(400).json({ error: "sport, brand, and cardSet are required" });
    return;
  }

  const id = randomUUID();
  const name = `${year ?? ""} ${brand} ${player ?? cardSet}${rookieCard ? " RC" : ""}`.trim();

  const card = {
    id,
    name,
    player: player ?? null,
    sport,
    year: year ?? null,
    brand,
    cardSet,
    cardNumber: cardNumber ?? null,
    imageUrl: null,
    estimatedValue: String(estimatedValue ?? 0),
    condition: condition ?? null,
    rookieCard: rookieCard ?? false,
    serialNumbered: serialNumbered ?? false,
    description: description ?? null,
  };

  await db.insert(cardsTable).values(card);
  res.status(201).json(formatCard(card as any));
});

// GET /cards/:id
router.get("/cards/:id", async (req, res) => {
  const parsed = GetCardParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, parsed.data.id)).limit(1);

  if (!card[0]) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  res.json(formatCard(card[0]));
});

function formatCard(card: typeof cardsTable.$inferSelect) {
  return {
    id: card.id,
    name: card.name,
    player: card.player,
    sport: card.sport,
    year: card.year,
    brand: card.brand,
    cardSet: card.cardSet,
    cardNumber: card.cardNumber,
    imageUrl: card.imageUrl,
    estimatedValue: Number(card.estimatedValue),
    condition: card.condition,
    rookieCard: card.rookieCard,
    serialNumbered: card.serialNumbered,
    description: card.description,
  };
}

export { router as cardsRouter, formatCard };
