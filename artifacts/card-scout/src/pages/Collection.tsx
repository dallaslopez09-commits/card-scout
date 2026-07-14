import { useState, useRef, useEffect } from "react";
import { useGetCollection, useGetCollectionSummary, useUpdateCollectionItem, useRemoveFromCollection, getGetCollectionSummaryQueryKey, getGetPortfolioHistoryQueryKey, getGetCollectionQueryKey } from "@workspace/api-client-react";
import { CardDisplay } from "@/components/CardDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowUpDown, Trash2, Edit2, Check, Download, UploadCloud, Clock } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUpload } from "@workspace/object-storage-web";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Collection() {
  const queryClient = useQueryClient();
  const { data: collection, isLoading: isCollectionLoading } = useGetCollection();
  const { data: summary, isLoading: isSummaryLoading } = useGetCollectionSummary();
  
  const [sortField, setSortField] = useState<'value' | 'acquired' | 'gain' | 'roi'>('value');
  const [sortDesc, setSortDesc] = useState(true);
  
  const [sportFilter, setSportFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('');

  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const isLoading = isCollectionLoading || isSummaryLoading;

  const { data: refreshStatus } = useQuery({
    queryKey: ['collection-refresh-status'],
    queryFn: async () => {
      const r = await fetch('/api/collection/refresh-status', { credentials: 'include' });
      return r.json() as Promise<{ isRunning: boolean; lastRunAt: string | null; nextRunAt: string | null; lastResult: { updated: number; failed: number; total: number } | null }>;
    },
    refetchInterval: 30_000,
  });

  const prevIsRunning = useRef(false);
  useEffect(() => {
    if (prevIsRunning.current && !refreshStatus?.isRunning) {
      queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCollectionSummaryQueryKey() });
    }
    prevIsRunning.current = refreshStatus?.isRunning ?? false;
  }, [refreshStatus?.isRunning, queryClient]);

  const handleExportCsv = () => {
    if (!collection || collection.length === 0) return;
    
    const headers = ['Player', 'Year', 'Brand', 'Set', 'Card#', 'Sport', 'Condition', 'Purchase Price', 'Grading Fee', 'Shipping Fee', 'Other Fees', 'True Cost', 'Current Value', 'eBay Price', 'Gain/Loss', 'ROI%', 'Acquired Date'];
    
    const rows = collection.map(item => {
      const c = item.card;
      const trueCost = item.trueCost || item.purchasePrice;
      const gainLoss = item.currentValue - trueCost;
      const roi = trueCost > 0 ? (gainLoss / trueCost) * 100 : 0;
      
      return [
        `"${c.player || c.name || ''}"`,
        `"${c.year || ''}"`,
        `"${c.brand || ''}"`,
        `"${c.cardSet || ''}"`,
        `"${c.cardNumber || ''}"`,
        `"${c.sport || ''}"`,
        `"${item.condition || ''}"`,
        item.purchasePrice || 0,
        item.gradingFee || 0,
        item.shippingFee || 0,
        item.otherFees || 0,
        trueCost,
        item.currentValue || 0,
        item.ebayPrice || '',
        gainLoss,
        roi.toFixed(2),
        new Date(item.acquiredAt).toLocaleDateString()
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, `card-scout-collection-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredCollection = collection ? collection.filter(item => {
    const matchSport = sportFilter === 'All' || (item.card.sport && item.card.sport.toLowerCase().includes(sportFilter.toLowerCase()));
    const matchCondition = !conditionFilter || (item.condition && item.condition.toLowerCase().includes(conditionFilter.toLowerCase()));
    return matchSport && matchCondition;
  }) : [];

  const sortedCollection = [...filteredCollection].sort((a, b) => {
    let diff = 0;
    const trueCostA = a.trueCost || a.purchasePrice;
    const trueCostB = b.trueCost || b.purchasePrice;

    if (sortField === 'value') diff = a.currentValue - b.currentValue;
    else if (sortField === 'acquired') diff = new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
    else if (sortField === 'gain') diff = (a.currentValue - trueCostA) - (b.currentValue - trueCostB);
    else if (sortField === 'roi') {
      const roiA = trueCostA > 0 ? ((a.currentValue - trueCostA) / trueCostA) * 100 : 0;
      const roiB = trueCostB > 0 ? ((b.currentValue - trueCostB) / trueCostB) * 100 : 0;
      diff = roiA - roiB;
    }
    
    return sortDesc ? -diff : diff;
  });

  const toggleSort = (field: 'value' | 'acquired' | 'gain' | 'roi') => {
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
        
        {/* Refresh Status Strip */}
        <div className="mt-2 text-xs font-mono text-muted-foreground flex items-center gap-2">
          {refreshStatus?.isRunning ? (
            <>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Syncing prices from eBay…</span>
            </>
          ) : refreshStatus?.lastRunAt ? (
            <>
              <Clock className="w-3 h-3" />
              <span>Prices last synced {timeAgo(refreshStatus.lastRunAt)}</span>
            </>
          ) : (
            <span>Prices will sync automatically</span>
          )}
        </div>
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

      {/* Filters and Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-accent/50 p-3 rounded-md border border-border">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs font-mono">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sports</SelectItem>
              <SelectItem value="Baseball">Baseball</SelectItem>
              <SelectItem value="Basketball">Basketball</SelectItem>
              <SelectItem value="Football">Football</SelectItem>
              <SelectItem value="Hockey">Hockey</SelectItem>
              <SelectItem value="Soccer">Soccer</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            placeholder="Filter condition..." 
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-[180px] h-8 text-xs font-mono"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-end">
          <div className="flex gap-1">
            <Button 
              variant={sortField === 'value' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => toggleSort('value')}
              className="text-xs font-mono uppercase h-8 px-2"
            >
              Value <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
            <Button 
              variant={sortField === 'gain' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => toggleSort('gain')}
              className="text-xs font-mono uppercase h-8 px-2"
            >
              Gain <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
            <Button 
              variant={sortField === 'roi' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => toggleSort('roi')}
              className="text-xs font-mono uppercase h-8 px-2"
            >
              ROI% <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
            <Button 
              variant={sortField === 'acquired' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => toggleSort('acquired')}
              className="text-xs font-mono uppercase hidden md:flex h-8 px-2"
            >
              Acquired <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 border-l border-border/50 pl-3 ml-1">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 text-xs font-mono px-2" data-testid="export-csv-btn">
              <Download className="w-3 h-3 mr-1" /> Export CSV
            </Button>
            <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {filteredCollection.length} ITEMS
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {sortedCollection.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedCollection.map((item) => {
            const trueCost = item.trueCost || item.purchasePrice;
            const gain = item.currentValue - trueCost;
            const isPositive = gain >= 0;
            const roi = trueCost > 0 ? (gain / trueCost) * 100 : 0;
            
            return (
              <div key={item.id} className="relative group">
                <CardDisplay 
                  card={item.card} 
                  imageUrl={item.imageUrl}
                  footerContent={
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-sm font-mono">
                        <span className="text-muted-foreground">True Cost:</span>
                        <span>{formatCurrency(trueCost)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-mono">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-bold">{formatCurrency(item.currentValue)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-mono pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Return:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(gain)}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {isPositive ? '+' : ''}{roi.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {item.ebayPrice != null && (
                        <div className="flex justify-between items-center text-[10px] font-mono pt-1.5 text-muted-foreground border-t border-border/20">
                          <span>eBay Comp: <span className="font-semibold text-foreground">{formatCurrency(item.ebayPrice)}</span></span>
                          {item.ebayCheckedAt && (() => {
                            const diffHours = (Date.now() - new Date(item.ebayCheckedAt).getTime()) / (1000 * 3600);
                            let colorClass = "opacity-70";
                            if (diffHours > 20) colorClass = "text-amber-500 font-medium opacity-100";
                            else if (diffHours < 6) colorClass = "text-success font-medium opacity-100";
                            
                            return (
                              <div className="flex items-center gap-1">
                                <span className="opacity-50 hidden sm:inline">·</span>
                                <span className={colorClass} title={new Date(item.ebayCheckedAt).toLocaleString()}>
                                  {timeAgo(item.ebayCheckedAt)}
                                </span>
                              </div>
                            );
                          })()}
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
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice?.toString() || "0");
  const [gradingFee, setGradingFee] = useState(item.gradingFee?.toString() || "0");
  const [shippingFee, setShippingFee] = useState(item.shippingFee?.toString() || "0");
  const [otherFees, setOtherFees] = useState(item.otherFees?.toString() || "0");
  const [currentValue, setCurrentValue] = useState(item.currentValue?.toString() || "0");
  const [condition, setCondition] = useState(item.condition || "");
  
  const updateMutation = useUpdateCollectionItem();
  const removeMutation = useRemoveFromCollection();
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculatedTrueCost = 
    parseFloat(purchasePrice || "0") + 
    parseFloat(gradingFee || "0") + 
    parseFloat(shippingFee || "0") + 
    parseFloat(otherFees || "0");

  const handleUpdate = () => {
    updateMutation.mutate({
      id: item.id,
      data: {
        purchasePrice: parseFloat(purchasePrice),
        gradingFee: parseFloat(gradingFee),
        shippingFee: parseFloat(shippingFee),
        otherFees: parseFloat(otherFees),
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFile(file);
      if (response?.objectPath) {
        updateMutation.mutate({
          id: item.id,
          data: { imageUrl: response.objectPath }
        }, {
          onSuccess: () => {
            toast.success("Image uploaded successfully");
            queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
          },
          onError: () => toast.error("Failed to save image URL")
        });
      }
    } catch (err) {
      toast.error("Upload failed");
    }
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
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-lg">{item.card.name} - {item.card.cardSet}</div>
            
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <UploadCloud className="w-3 h-3 mr-2" />}
                {item.imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-accent/30 p-3 rounded-md border border-border">
            <div className="grid gap-2">
              <Label>Purchase Price ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={purchasePrice} 
                onChange={(e) => setPurchasePrice(e.target.value)} 
                className="font-mono bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label>Grading Fee ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={gradingFee} 
                onChange={(e) => setGradingFee(e.target.value)} 
                className="font-mono bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label>Shipping Fee ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={shippingFee} 
                onChange={(e) => setShippingFee(e.target.value)} 
                className="font-mono bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label>Other Fees ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={otherFees} 
                onChange={(e) => setOtherFees(e.target.value)} 
                className="font-mono bg-background"
              />
            </div>
            <div className="col-span-2 pt-2 mt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-semibold uppercase text-muted-foreground">True Cost Basis</span>
              <span className="text-lg font-bold font-mono">{formatCurrency(calculatedTrueCost)}</span>
            </div>
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
