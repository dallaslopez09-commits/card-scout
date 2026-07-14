import { useState } from "react";
import { useGetCollection, useGetCollectionSummary, useUpdateCollectionItem, useRemoveFromCollection, getGetCollectionSummaryQueryKey, getGetPortfolioHistoryQueryKey, getGetCollectionQueryKey } from "@workspace/api-client-react";
import { CardDisplay } from "@/components/CardDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowUpDown, Trash2, Edit2, Check, X } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Collection() {
  const { data: collection, isLoading: isCollectionLoading } = useGetCollection();
  const { data: summary, isLoading: isSummaryLoading } = useGetCollectionSummary();
  
  const [sortField, setSortField] = useState<'value' | 'acquired' | 'gain'>('value');
  const [sortDesc, setSortDesc] = useState(true);
  
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const isLoading = isCollectionLoading || isSummaryLoading;

  const sortedCollection = collection ? [...collection].sort((a, b) => {
    let diff = 0;
    if (sortField === 'value') diff = a.currentValue - b.currentValue;
    else if (sortField === 'acquired') diff = new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
    else if (sortField === 'gain') diff = (a.currentValue - a.purchasePrice) - (b.currentValue - b.purchasePrice);
    
    return sortDesc ? -diff : diff;
  }) : [];

  const toggleSort = (field: 'value' | 'acquired' | 'gain') => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
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
        <h1 className="text-3xl font-bold tracking-tight">The Vault</h1>
        <p className="text-muted-foreground">Manage your owned assets and track their performance.</p>
      </div>

      {/* Summary Strip */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-8 w-full md:w-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Value</p>
            <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(summary?.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Cost Basis</p>
            <p className="text-2xl font-mono font-bold text-muted-foreground">{formatCurrency(summary?.totalCost)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Unrealized Gain</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-mono font-bold ${(summary?.totalGain || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {(summary?.totalGain || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.totalGain)}
              </p>
              <span className={`text-sm font-mono font-medium px-2 py-0.5 rounded-sm ${(summary?.totalGain || 0) >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {(summary?.totalGainPercent || 0) >= 0 ? '+' : ''}{formatPercent(summary?.totalGainPercent)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-accent/50 p-2 rounded-md">
        <div className="flex gap-2">
          <Button 
            variant={sortField === 'value' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => toggleSort('value')}
            className="text-xs font-mono uppercase"
          >
            Value <ArrowUpDown className="w-3 h-3 ml-1" />
          </Button>
          <Button 
            variant={sortField === 'gain' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => toggleSort('gain')}
            className="text-xs font-mono uppercase"
          >
            Gain <ArrowUpDown className="w-3 h-3 ml-1" />
          </Button>
          <Button 
            variant={sortField === 'acquired' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => toggleSort('acquired')}
            className="text-xs font-mono uppercase hidden sm:flex"
          >
            Acquired <ArrowUpDown className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="text-xs font-mono text-muted-foreground mr-4">
          {collection?.length || 0} ITEMS
        </div>
      </div>

      {/* Grid */}
      {sortedCollection.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedCollection.map((item) => {
            const gain = item.currentValue - item.purchasePrice;
            const isPositive = gain >= 0;
            
            return (
              <div key={item.id} className="relative group">
                <CardDisplay 
                  card={item.card} 
                  footerContent={
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-sm font-mono">
                        <span className="text-muted-foreground">Cost:</span>
                        <span>{formatCurrency(item.purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-mono">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-bold">{formatCurrency(item.currentValue)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-mono pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Return:</span>
                        <span className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                          {isPositive ? '+' : ''}{formatCurrency(gain)}
                        </span>
                      </div>
                    </div>
                  }
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 rounded-full shadow-md hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
          <p className="font-semibold text-foreground text-lg">Your vault is empty</p>
          <p className="text-sm mt-1 max-w-sm">Search for cards or use AI Scan to start building your collection.</p>
        </div>
      )}

      {editingItem && (
        <EditItemDialog 
          item={editingItem} 
          open={!!editingItem} 
          onOpenChange={(open) => !open && setEditingItem(null)} 
        />
      )}
    </div>
  );
}

function EditItemDialog({ item, open, onOpenChange }: { item: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice.toString());
  const [currentValue, setCurrentValue] = useState(item.currentValue.toString());
  const [condition, setCondition] = useState(item.condition || "");
  
  const updateMutation = useUpdateCollectionItem();
  const removeMutation = useRemoveFromCollection();
  const queryClient = useQueryClient();

  const handleUpdate = () => {
    updateMutation.mutate({
      id: item.id,
      data: {
        purchasePrice: parseFloat(purchasePrice),
        currentValue: parseFloat(currentValue),
        condition
      }
    }, {
      onSuccess: () => {
        toast.success("Card updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCollectionSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPortfolioHistoryQueryKey() });
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to update card")
    });
  };

  const handleRemove = () => {
    if (confirm("Are you sure you want to remove this card from your collection? This action cannot be undone.")) {
      removeMutation.mutate({ id: item.id }, {
        onSuccess: () => {
          toast.success("Card removed from collection");
          queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCollectionSummaryQueryKey() });
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to remove card")
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vault Asset</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="font-semibold">{item.card.name} - {item.card.cardSet}</div>
          
          <div className="grid gap-2">
            <Label>Cost Basis ($)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={purchasePrice} 
              onChange={(e) => setPurchasePrice(e.target.value)} 
              className="font-mono"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Current Value ($)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={currentValue} 
              onChange={(e) => setCurrentValue(e.target.value)} 
              className="font-mono"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Grade / Condition</Label>
            <Input 
              value={condition} 
              onChange={(e) => setCondition(e.target.value)} 
              placeholder="e.g. PSA 10, BGS 9.5"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="destructive" onClick={handleRemove} disabled={removeMutation.isPending || updateMutation.isPending}>
            {removeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending || removeMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
