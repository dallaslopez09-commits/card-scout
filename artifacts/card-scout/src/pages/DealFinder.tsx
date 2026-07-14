import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Tag, Search, ExternalLink, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DealResult {
  deals: Array<{
    title: string;
    price: number;
    currency: string;
    listingUrl: string;
    imageUrl: string | null;
    condition: string | null;
    timeLeft: string | null;
    shippingCost: number | null;
    totalPrice: number;
    soldMedian: number | null;
    discount: number | null;
    dealScore: number;
  }>;
  soldMedian: number | null;
  searchQuery: string;
  total: number;
}

export default function DealFinder() {
  const [query, setQuery] = useState("");
  const [minDiscount, setMinDiscount] = useState<number>(10);
  const [results, setResults] = useState<DealResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const r = await fetch(`/api/deals/search?q=${encodeURIComponent(query)}&minDiscount=${minDiscount}`, { credentials: 'include' });
      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData.error || 'Failed to search deals');
      }
      setResults(await r.json());
    } catch (e: any) { 
      setError(e.message); 
    } finally { 
      setIsSearching(false); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      search();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Deal Finder</h1>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold tracking-wider uppercase">Live eBay Data</span>
        </div>
        <p className="text-muted-foreground">Compare active eBay listings to recent sold prices — find underpriced cards instantly.</p>
      </div>

      <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Query</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 1986 Fleer Michael Jordan #57" 
              className="pl-9 font-mono"
            />
          </div>
        </div>
        
        <div className="w-full md:w-32 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min. Discount %</label>
          <Input 
            type="number"
            min={0}
            max={80}
            value={minDiscount}
            onChange={(e) => setMinDiscount(parseInt(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            className="font-mono"
          />
        </div>
        
        <Button onClick={search} disabled={isSearching || !query.trim()} className="w-full md:w-auto h-10 px-8">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Search Deals
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isSearching && !results && !error && (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
          <Tag className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-semibold text-foreground text-lg uppercase tracking-wide">Search for Deals</p>
          <p className="text-sm mt-1 max-w-sm">Search for a player, set, or card to find underpriced active listings.</p>
        </div>
      )}

      {!isSearching && results && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-accent/30 p-3 rounded-md border border-border">
            <div className="text-sm font-mono text-muted-foreground">
              Sold median: <span className="font-bold text-foreground">{formatCurrency(results.soldMedian)}</span>
            </div>
            <div className="text-sm font-mono text-muted-foreground">
              {results.total} listings found
            </div>
          </div>
          
          {results.soldMedian === null && (
             <div className="px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-sm font-medium flex items-center gap-2">
               <AlertCircle className="w-4 h-4" />
               No recent sold comps found — discount % unavailable for this search
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.deals.map((deal, idx) => {
              let scoreColor = "bg-muted text-muted-foreground";
              let scoreText = `— N/A`;
              if (deal.dealScore >= 70) {
                scoreColor = "bg-success text-success-foreground";
                scoreText = `🔥 DEAL ${deal.dealScore.toFixed(0)}`;
              } else if (deal.dealScore >= 50) {
                scoreColor = "bg-emerald-500 text-white";
                scoreText = `↑ GOOD ${deal.dealScore.toFixed(0)}`;
              } else if (deal.dealScore >= 30) {
                scoreColor = "bg-accent text-accent-foreground";
                scoreText = `— FAIR ${deal.dealScore.toFixed(0)}`;
              }

              let discountBadge = (
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-muted text-muted-foreground">
                  No comp data
                </span>
              );

              if (deal.discount !== null) {
                if (deal.discount > 0) {
                  discountBadge = (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-success/20 text-success">
                      +{deal.discount.toFixed(0)}% below market
                    </span>
                  );
                } else {
                  discountBadge = (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-destructive/20 text-destructive">
                      {Math.abs(deal.discount).toFixed(0)}% above market
                    </span>
                  );
                }
              }

              return (
                <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="relative">
                    {deal.imageUrl ? (
                      <img src={deal.imageUrl} alt={deal.title} className="w-full h-48 object-contain bg-muted/30" />
                    ) : (
                      <div className="w-full h-48 bg-muted/30 flex items-center justify-center">
                        <Tag className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-sm text-xs font-bold tracking-wider shadow-md ${scoreColor}`}>
                      {scoreText}
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-sm line-clamp-2 leading-snug mb-2" title={deal.title}>{deal.title}</h3>
                    
                    <div className="mb-4 flex flex-wrap gap-2">
                      {deal.condition && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                          {deal.condition}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Total Price</div>
                          <div className="text-xl font-mono font-bold">{formatCurrency(deal.totalPrice)}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {formatCurrency(deal.price)} + {formatCurrency(deal.shippingCost || 0)} sh
                          </div>
                        </div>
                        <div className="text-right">
                          {discountBadge}
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-border/50 flex justify-between items-center text-xs">
                        <div className="font-mono text-muted-foreground">
                          Sold Med: {deal.soldMedian ? <span className="font-bold text-foreground">{formatCurrency(deal.soldMedian)}</span> : 'N/A'}
                        </div>
                        {deal.timeLeft && (
                          <div className="text-muted-foreground truncate max-w-[100px] text-right" title={deal.timeLeft}>
                            {deal.timeLeft}
                          </div>
                        )}
                      </div>
                      
                      <Button variant="outline" className="w-full uppercase text-xs tracking-wider font-bold mt-2" asChild>
                        <a href={deal.listingUrl} target="_blank" rel="noopener noreferrer">
                          View on eBay <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
