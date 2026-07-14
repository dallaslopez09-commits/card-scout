import { useState } from "react";
import { Card as CardType } from "@workspace/api-client-react/api.schemas";
import { useAddToCollection, useAddToWishlist, getGetCollectionQueryKey, getGetWishlistQueryKey, getGetCollectionSummaryQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddCardDialogProps {
  card: CardType;
  mode: 'collection' | 'wishlist';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCardDialog({ card, mode, open, onOpenChange }: AddCardDialogProps) {
  const [price, setPrice] = useState(card.estimatedValue.toString());
  const [condition, setCondition] = useState("");
  
  const addToCollection = useAddToCollection();
  const addToWishlist = useAddToWishlist();
  const queryClient = useQueryClient();

  const isCollection = mode === 'collection';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCollection) {
      addToCollection.mutate({
        data: {
          cardId: card.id,
          purchasePrice: parseFloat(price) || 0,
          quantity: 1,
          condition
        }
      }, {
        onSuccess: () => {
          toast.success("Asset secured in Vault");
          queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCollectionSummaryQueryKey() });
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to add to Vault")
      });
    } else {
      addToWishlist.mutate({
        data: {
          cardId: card.id,
          targetPrice: parseFloat(price) || undefined,
          notes: condition
        }
      }, {
        onSuccess: () => {
          toast.success("Asset added to Wishlist");
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to add to Wishlist")
      });
    }
  };

  const isPending = addToCollection.isPending || addToWishlist.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isCollection ? "Acquire Asset" : "Track Asset"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-6">
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="font-bold text-lg leading-tight">{card.name}</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">
                {card.year} {card.brand} {card.cardSet}
              </p>
            </div>
            
            <div className="grid gap-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {isCollection ? "Purchase Price ($)" : "Target Price ($)"}
              </Label>
              <Input 
                type="number" 
                step="0.01" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required
                className="font-mono h-12 text-lg"
              />
            </div>
            
            <div className="grid gap-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {isCollection ? "Grade / Condition" : "Notes"}
              </Label>
              <Input 
                value={condition} 
                onChange={(e) => setCondition(e.target.value)} 
                placeholder={isCollection ? "e.g. PSA 10, Raw" : "e.g. Snipe under $50"}
                className="h-10"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="font-bold tracking-wide uppercase px-6">
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isCollection ? "Add to Vault" : "Add to Hunt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
