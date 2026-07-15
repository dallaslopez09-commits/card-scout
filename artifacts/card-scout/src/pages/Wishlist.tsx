import { useState } from "react";
import { useGetWishlist, useRemoveFromWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { CardDisplay } from "@/components/CardDisplay";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Target, MoveRight, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddCardDialog } from "@/components/AddCardDialog";
import { apiFetch } from "@/lib/apiFetch";

export default function Wishlist() {
  const { data: wishlist, isLoading } = useGetWishlist();
  const removeMutation = useRemoveFromWishlist();
  const queryClient = useQueryClient();
  
  const [movingItem, setMovingItem] = useState<any | null>(null);
  const [ebayData, setEbayData] = useState<Record<string, { medianPrice: number | null; searchQuery: string }>>({});
  const [checkingEbayFor, setCheckingEbayFor] = useState<string | null>(null);

  const checkEbay = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckingEbayFor(cardId);
    try {
      const res = await apiFetch(`/api/cards/${cardId}/ebay-comps`);
      const data = await res.json();
      setEbayData(prev => ({ ...prev, [cardId]: data }));
    } catch (err) {
      toast.error("Failed to fetch eBay comps");
    } finally {
      setCheckingEbayFor(null);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Remove this card from your wishlist?")) {
      removeMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Target abandoned");
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        },
        onError: () => toast.error("Failed to remove")
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">The Hunt</h1>
        <p className="text-muted-foreground">Track target assets and monitor market prices.</p>
      </div>

      <div className="bg-accent/50 p-3 rounded-md border border-border flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Target className="w-4 h-4" />
          <span>Active Targets</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {wishlist?.length || 0} CARDS TRACKED
        </div>
      </div>

      {wishlist && wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const isDiscounted = item.card.estimatedValue < (item.targetPrice || 0);
            
            return (
              <div key={item.id} className="relative group">
                <CardDisplay 
                  card={item.card} 
                  footerContent={
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-sm font-mono">
                        <span className="text-muted-foreground">Est. Market:</span>
                        <span className="font-bold">{formatCurrency(item.card.estimatedValue)}</span>
                      </div>
                      
                      {ebayData[item.card.id] ? (
                        <div className="flex justify-between items-center text-sm font-mono pt-2 border-t border-border/50 bg-accent/20 -mx-4 px-4 pb-2">
                          <span className="text-muted-foreground flex items-center gap-1">
                            eBay Median:
                          </span>
                          <span className="font-bold text-primary">
                            {ebayData[item.card.id].medianPrice !== null ? formatCurrency(ebayData[item.card.id].medianPrice) : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-border/50">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs h-7"
                            onClick={(e) => checkEbay(item.card.id, e)}
                            disabled={checkingEbayFor === item.card.id}
                          >
                            {checkingEbayFor === item.card.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
                            Check eBay
                          </Button>
                        </div>
                      )}

                      {item.targetPrice && (
                        <div className="flex justify-between items-center text-sm font-mono pt-2 border-t border-border/50">
                          <span className="text-muted-foreground">Target Price:</span>
                          <span className={`font-bold ${isDiscounted ? 'text-success' : 'text-primary'}`}>
                            {formatCurrency(item.targetPrice)}
                          </span>
                        </div>
                      )}
                      
                      {isDiscounted && (
                        <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-success bg-success/10 py-1 px-2 rounded text-center" data-testid={`below-target-${item.id}`}>
                          Below Target Price
                        </div>
                      )}
                      
                      {ebayData[item.card.id]?.medianPrice !== null && item.targetPrice && ebayData[item.card.id].medianPrice! < item.targetPrice && (
                         <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-success bg-success/10 py-1 px-2 rounded text-center">
                           eBay Below Target
                         </div>
                      )}
                    </div>
                  }
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 rounded-full shadow-md hover:bg-success hover:text-success-foreground"
                    title="Acquire (Move to Vault)"
                    onClick={() => setMovingItem(item)}
                  >
                    <MoveRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 rounded-full shadow-md hover:bg-destructive hover:text-destructive-foreground"
                    title="Remove from Hunt"
                    onClick={(e) => handleRemove(item.id, e)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
          <Target className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-semibold text-foreground text-lg">No active targets</p>
          <p className="text-sm mt-1 max-w-sm">Use the search tool to find cards you want to track.</p>
        </div>
      )}

      {movingItem && (
        <AddCardDialog 
          card={movingItem.card} 
          mode="collection" 
          open={!!movingItem} 
          onOpenChange={(open) => {
            if (!open) setMovingItem(null);
            // We could auto-remove from wishlist here, but let's keep it simple
          }} 
        />
      )}
    </div>
  );
}
