/**
 * eBay Finding API — searches sold/completed listings for card comps.
 * Docs: https://developer.ebay.com/devzone/finding/callref/findCompletedItems.html
 */

export interface EbayComp {
  title: string;
  price: number;
  currency: string;
  soldDate: string;
  listingUrl: string;
  condition: string | null;
}

export interface EbayCompsResult {
  comps: EbayComp[];
  medianPrice: number | null;
  averagePrice: number | null;
  sampleSize: number;
  searchQuery: string;
}

function buildKeywords(card: {
  player?: string | null;
  year?: number | null;
  brand?: string | null;
  cardSet?: string | null;
  cardNumber?: string | null;
  rookieCard?: boolean | null;
}): string {
  const parts: string[] = [];
  if (card.year) parts.push(String(card.year));
  if (card.brand) parts.push(card.brand);
  if (card.player) parts.push(card.player);
  if (card.cardNumber) parts.push(card.cardNumber);
  if (card.rookieCard) parts.push("rookie RC");
  return parts.filter(Boolean).join(" ");
}

export async function fetchEbayComps(card: {
  player?: string | null;
  year?: number | null;
  brand?: string | null;
  cardSet?: string | null;
  cardNumber?: string | null;
  rookieCard?: boolean | null;
}): Promise<EbayCompsResult> {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) throw new Error("EBAY_APP_ID not configured");

  const keywords = buildKeywords(card);
  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "GLOBAL-ID": "EBAY-US",
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "",
    keywords,
    "categoryId": "212", // Sports Trading Cards
    "itemFilter(0).name": "SoldItemsOnly",
    "itemFilter(0).value": "true",
    "sortOrder": "EndTimeSoonest",
    "paginationInput.entriesPerPage": "10",
    "paginationInput.pageNumber": "1",
    "outputSelector(0)": "SellerInfo",
  });

  const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });

  if (!resp.ok) {
    throw new Error(`eBay API error: ${resp.status}`);
  }

  const data = await resp.json();
  const result = data?.findCompletedItemsResponse?.[0];
  const items = result?.searchResult?.[0]?.item ?? [];

  const comps: EbayComp[] = items.map((item: any) => ({
    title: item.title?.[0] ?? "",
    price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] ?? "0"),
    currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.["@currencyId"] ?? "USD",
    soldDate: item.listingInfo?.[0]?.endTime?.[0] ?? "",
    listingUrl: item.viewItemURL?.[0] ?? "",
    condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? null,
  })).filter((c: EbayComp) => c.price > 0);

  const prices = comps.map((c) => c.price).sort((a, b) => a - b);
  const medianPrice = prices.length
    ? prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)]
    : null;
  const averagePrice = prices.length
    ? prices.reduce((s, p) => s + p, 0) / prices.length
    : null;

  return { comps, medianPrice, averagePrice, sampleSize: comps.length, searchQuery: keywords };
}
