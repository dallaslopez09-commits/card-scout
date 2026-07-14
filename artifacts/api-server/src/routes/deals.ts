import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const EBAY_BASE = "https://svcs.ebay.com/services/search/FindingService/v1";

interface ActiveListing {
  title: string;
  price: number;
  currency: string;
  listingUrl: string;
  imageUrl: string | null;
  condition: string | null;
  timeLeft: string | null;
  shippingCost: number | null;
  totalPrice: number;  // price + shipping
  soldMedian: number | null;
  discount: number | null; // % below sold median (positive = deal)
  dealScore: number; // 0-100
}

async function fetchJson(url: string): Promise<any> {
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) throw new Error(`eBay API ${resp.status}`);
  return resp.json();
}

async function getSoldMedian(keywords: string, appId: string): Promise<number | null> {
  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "GLOBAL-ID": "EBAY-US",
    "RESPONSE-DATA-FORMAT": "JSON",
    keywords,
    "categoryId": "212",
    "itemFilter(0).name": "SoldItemsOnly",
    "itemFilter(0).value": "true",
    "sortOrder": "EndTimeSoonest",
    "paginationInput.entriesPerPage": "10",
  });
  const data = await fetchJson(`${EBAY_BASE}?${params}`);
  const items: any[] = data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item ?? [];
  const prices = items
    .map((i: any) => parseFloat(i.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] ?? "0"))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (!prices.length) return null;
  return prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
    : prices[Math.floor(prices.length / 2)];
}

async function getActiveListings(keywords: string, appId: string): Promise<any[]> {
  const params = new URLSearchParams({
    "OPERATION-NAME": "findItemsAdvanced",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "GLOBAL-ID": "EBAY-US",
    "RESPONSE-DATA-FORMAT": "JSON",
    keywords,
    "categoryId": "212",
    "itemFilter(0).name": "ListingType",
    "itemFilter(0).value(0)": "FixedPrice",
    "itemFilter(0).value(1)": "Auction",
    "sortOrder": "PricePlusShippingLowest",
    "paginationInput.entriesPerPage": "20",
    "outputSelector(0)": "PictureURLLarge",
    "outputSelector(1)": "ShippingCosts",
  });
  const data = await fetchJson(`${EBAY_BASE}?${params}`);
  return data?.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? [];
}

// GET /deals/search?q=...&sport=...&minDiscount=15
router.get("/deals/search", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const appId = process.env.EBAY_APP_ID;
  if (!appId) { res.status(500).json({ error: "eBay not configured" }); return; }

  const q = String(req.query.q || "").trim();
  if (!q) { res.status(400).json({ error: "q is required" }); return; }

  const minDiscount = parseFloat(String(req.query.minDiscount || "10"));

  try {
    // Run both requests in parallel
    const [rawListings, soldMedian] = await Promise.all([
      getActiveListings(q, appId),
      getSoldMedian(q, appId),
    ]);

    const deals: ActiveListing[] = rawListings.map((item: any) => {
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] ?? "0");
      const shippingCost = parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.["__value__"] ?? "0") || 0;
      const totalPrice = price + shippingCost;

      const discount = soldMedian && soldMedian > 0
        ? Math.round(((soldMedian - totalPrice) / soldMedian) * 100)
        : null;

      // Score: 50 base + up to 50 from discount depth. Cap at 100.
      const dealScore = discount !== null
        ? Math.max(0, Math.min(100, Math.round(50 + discount)))
        : 0;

      return {
        title: item.title?.[0] ?? "",
        price,
        currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.["@currencyId"] ?? "USD",
        listingUrl: item.viewItemURL?.[0] ?? "",
        imageUrl: item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? null,
        condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? null,
        timeLeft: item.listingInfo?.[0]?.timeLeft?.[0] ?? null,
        shippingCost: shippingCost || null,
        totalPrice,
        soldMedian,
        discount,
        dealScore,
      };
    });

    // Sort: best deals first (highest discount), filter if minDiscount set
    const filtered = deals
      .filter((d) => d.discount === null || d.discount >= minDiscount)
      .sort((a, b) => (b.discount ?? -999) - (a.discount ?? -999));

    res.json({ deals: filtered, soldMedian, searchQuery: q, total: filtered.length });
  } catch (err) {
    logger.error({ err }, "Deal search failed");
    res.status(500).json({ error: "eBay search failed — try again shortly" });
  }
});

export { router as dealsRouter };
