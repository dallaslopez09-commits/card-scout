import { Router } from "express";
import { db } from "@workspace/db";
import { cardsTable } from "@workspace/db";
import { SearchCardsQueryParams, ScanCardBody, GetCardParams } from "@workspace/api-zod";
import { eq, ilike, and, sql, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { fetchEbayComps } from "../lib/ebay";

const router = Router();

// GET /cards/search
router.get("/cards/search", async (req, res) => {
  const parsed = SearchCardsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query params" }); return; }

  const { q, sport, year, brand, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (q) conditions.push(or(ilike(cardsTable.name, `%${q}%`), ilike(cardsTable.player, `%${q}%`), ilike(cardsTable.cardSet, `%${q}%`)));
  if (sport) conditions.push(ilike(cardsTable.sport, `%${sport}%`));
  if (year) conditions.push(eq(cardsTable.year, year));
  if (brand) conditions.push(ilike(cardsTable.brand, `%${brand}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [cards, countResult] = await Promise.all([
    db.select().from(cardsTable).where(where).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(cardsTable).where(where),
  ]);

  res.json({ cards: cards.map(formatCard), total: Number(countResult[0]?.count ?? 0), page, limit });
});

// POST /cards — manual card creation
router.post("/cards", async (req, res) => {
  const { player, sport, year, brand, cardSet, cardNumber, estimatedValue, condition, rookieCard, serialNumbered, description } = req.body;
  if (!sport || !brand || !cardSet) { res.status(400).json({ error: "sport, brand, and cardSet are required" }); return; }

  const id = randomUUID();
  const name = `${year ?? ""} ${brand} ${player ?? cardSet}${rookieCard ? " RC" : ""}`.trim();
  const card = { id, name, player: player ?? null, sport, year: year ?? null, brand, cardSet, cardNumber: cardNumber ?? null, imageUrl: null, estimatedValue: String(estimatedValue ?? 0), condition: condition ?? null, rookieCard: rookieCard ?? false, serialNumbered: serialNumbered ?? false, description: description ?? null };

  await db.insert(cardsTable).values(card as any);
  res.status(201).json(formatCard(card as any));
});

// POST /cards/scan — AI-powered card identification
router.post("/cards/scan", async (req, res) => {
  const parsed = ScanCardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { imageBase64, mimeType = "image/jpeg" } = parsed.data;
  if (!process.env.ANTHROPIC_API_KEY) { res.status(400).json({ error: "Anthropic API key not configured" }); return; }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are a sports card image reader. Your ONLY job is to read text and images that are physically printed on this card.

CRITICAL RULES:
- Only report values you can literally READ from the card image. Do NOT use your training knowledge to fill in missing details.
- Year: read the year that is printed somewhere on the card (front, back, or set name). If no year is printed on the card, return null — do not guess based on the player or set.
- Brand/manufacturer: read the logo or text on the card. Return null if not visible.
- Card set name: read the set name printed on the card. Return null if not visible.
- Card number: read the number (e.g. "#57" or "57 of 500"). Return null if not visible.
- Player name: read the name printed on the card.
- Sport: infer only from the image (uniform, equipment, field). Use "Baseball", "Basketball", "Football", "Hockey", or "Soccer".
- Rookie card: only true if the card physically shows "RC", "Rookie", or "Rookie Card" text/logo.
- Serial numbered: only true if you can see "X/Y" serial stamp (e.g. "047/100").
- Do NOT estimate a market value — leave estimatedValue as null.
- Description: briefly describe what you can see on the card (player image, design, colors).
- confidence: "high" if you can read most fields clearly, "medium" if partially obscured, "low" if very hard to read.

Respond ONLY with this exact JSON (no markdown, no extra text):
{"identified":true,"player":"Name or null","year":1989,"brand":"Brand or null","cardSet":"Set Name or null","cardNumber":"#57 or null","sport":"Baseball","rookieCard":false,"serialNumbered":false,"estimatedValue":null,"condition":null,"description":"What you see on the card","confidence":"high","notes":"Anything unclear or notable about the image"}

If the image does not show a sports card at all, return: {"identified":false}`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 } },
        { type: "text", text: prompt },
      ] }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    if (!result.identified) {
      res.json({ identified: false, card: null, confidence: "low", notes: result.notes ?? "No card detected in image." });
      return;
    }

    // Fetch real eBay sold prices immediately after identification
    let ebayComps = null;
    let marketPrice: number | null = null;
    try {
      ebayComps = await fetchEbayComps({
        player: result.player,
        year: result.year,
        brand: result.brand,
        cardSet: result.cardSet,
        cardNumber: result.cardNumber,
        rookieCard: result.rookieCard,
      });
      marketPrice = ebayComps.medianPrice ?? ebayComps.averagePrice ?? null;
    } catch (ebayErr) {
      logger.warn({ ebayErr }, "eBay comps fetch failed during scan — price will be null");
    }

    const cardId = randomUUID();
    const cardName = result.player
      ? `${result.year ?? ""} ${result.brand ?? ""} ${result.player}${result.rookieCard ? " RC" : ""}`.trim()
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
      // Use eBay market price if available, otherwise 0 (user must fill in)
      estimatedValue: String(marketPrice ?? 0),
      condition: result.condition ?? null,
      rookieCard: result.rookieCard ?? false,
      serialNumbered: result.serialNumbered ?? false,
      description: result.description ?? null,
    };

    await db.insert(cardsTable).values(card as any).onConflictDoNothing();

    res.json({
      identified: true,
      card: formatCard(card as any),
      confidence: result.confidence ?? null,
      notes: result.notes ?? null,
      // Send eBay data so the UI can show the source
      ebayComps: ebayComps ? {
        medianPrice: ebayComps.medianPrice,
        averagePrice: ebayComps.averagePrice,
        sampleSize: ebayComps.sampleSize,
        searchQuery: ebayComps.searchQuery,
        topComp: ebayComps.comps[0] ?? null,
      } : null,
    });
  } catch (err) {
    logger.error({ err }, "Card scan failed");
    res.status(500).json({ error: "Card identification failed. Please try again." });
  }
});

// GET /cards/:id/ebay-comps
router.get("/cards/:id/ebay-comps", async (req, res) => {
  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, req.params.id)).limit(1);
  if (!card[0]) { res.status(404).json({ error: "Card not found" }); return; }
  try {
    const result = await fetchEbayComps(card[0]);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "eBay comps fetch failed");
    res.status(500).json({ error: "Failed to fetch eBay data" });
  }
});

// GET /cards/:id
router.get("/cards/:id", async (req, res) => {
  const parsed = GetCardParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid card ID" }); return; }
  const card = await db.select().from(cardsTable).where(eq(cardsTable.id, parsed.data.id)).limit(1);
  if (!card[0]) { res.status(404).json({ error: "Card not found" }); return; }
  res.json(formatCard(card[0]));
});

export { router as cardsRouter };

export function formatCard(card: typeof cardsTable.$inferSelect) {
  return {
    id: card.id, name: card.name, player: card.player, sport: card.sport, year: card.year,
    brand: card.brand, cardSet: card.cardSet, cardNumber: card.cardNumber, imageUrl: card.imageUrl,
    estimatedValue: Number(card.estimatedValue), condition: card.condition, rookieCard: card.rookieCard,
    serialNumbered: card.serialNumbered, description: card.description,
  };
}
