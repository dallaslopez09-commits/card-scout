import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, CheckCircle2, Target, Plus, ExternalLink, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface SetGoal {
  id: string;
  setName: string;
  brand: string;
  year: number | null;
  sport: string | null;
  totalCards: number | null;
  notes: string | null;
  createdAt: string;
}

interface CompletionData {
  goal: SetGoal;
  ownedCount: number;
  totalCards: number | null;
  completionPct: number | null;
  totalValue: number;
  totalCost: number;
  ownedCards: Array<{
    collectionItemId: string;
    card: any;
    condition: string | null;
    currentValue: number;
    purchasePrice: number;
    acquiredAt: string;
  }>;
}

export default function Sets() {
  const [sets, setSets] = useState<SetGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSets = async () => {
    try {
      const r = await fetch('/api/sets', { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch sets');
      setSets(await r.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchCompletion = async (id: string) => {
    setIsLoadingCompletion(true);
    setCompletion(null);
    try {
      const r = await fetch(`/api/sets/${id}/completion`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch completion data');
      setCompletion(await r.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoadingCompletion(false);
    }
  };

  useEffect(() => {
    if (selected) {
      fetchCompletion(selected);
    } else {
      setCompletion(null);
    }
  }, [selected]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this tracked set? Your cards will remain in your vault.")) return;
    
    setDeletingId(id);
    try {
      const r = await fetch(`/api/sets/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) throw new Error('Failed to delete set');
      toast.success("Set tracking removed");
      if (selected === id) setSelected(null);
      await fetchSets();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Set Tracker</h1>
          <p className="text-muted-foreground">Track your progress toward completing full sets.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="uppercase tracking-wider font-bold text-xs h-10">
          <Plus className="w-4 h-4 mr-2" /> Track New Set
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
          <Target className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-semibold text-foreground text-lg uppercase tracking-wide">No Sets Tracked</p>
          <p className="text-sm mt-1 max-w-sm mb-6">Start tracking a set to automatically see your progress based on cards in your Vault.</p>
          <Button onClick={() => setAddDialogOpen(true)} variant="outline">Track your first set</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Tracked Sets</h2>
            <div className="space-y-3">
              {sets.map(set => {
                const isSelected = selected === set.id;
                
                // We don't have pct in the list view inherently unless we derive it or add it to API.
                // For now, we will show what we can or indicate selection.
                return (
                  <div 
                    key={set.id}
                    onClick={() => setSelected(set.id)}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md relative group ${isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold leading-tight">
                        {set.year ? `${set.year} ` : ''}{set.setName}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive -mr-1 -mt-1"
                        onClick={(e) => handleDelete(set.id, e)}
                        disabled={deletingId === set.id}
                      >
                        {deletingId === set.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                        {set.brand}
                      </span>
                      {set.sport && (
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                          {set.sport}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs font-mono text-muted-foreground flex justify-between items-center mt-2">
                      <span>{set.totalCards ? `${set.totalCards} cards total` : '? cards total'}</span>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right panel: Detail */}
          <div className="lg:col-span-8 bg-card border border-border rounded-lg min-h-[500px]">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Target className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-semibold text-foreground">Select a set</p>
                <p className="text-sm mt-1">Choose a set from the list to see your completion progress and owned cards.</p>
              </div>
            ) : isLoadingCompletion ? (
              <div className="h-full flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground animate-pulse">Calculating collection match...</p>
              </div>
            ) : completion ? (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {completion.goal.year ? `${completion.goal.year} ` : ''}{completion.goal.setName}
                    </h2>
                    <p className="text-muted-foreground font-mono">
                      {completion.totalCards ? (
                         <span><strong className="text-foreground">{completion.ownedCount}</strong> of {completion.totalCards} cards owned</span>
                      ) : (
                         <span><strong className="text-foreground">{completion.ownedCount}</strong> cards owned</span>
                      )}
                    </p>
                  </div>
                  
                  <Button variant="outline" size="sm" className="uppercase tracking-wider font-bold text-xs" asChild>
                    <a 
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent((completion.goal.year ? completion.goal.year + ' ' : '') + completion.goal.brand + ' ' + completion.goal.setName)}&_sacat=212`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Find Missing on eBay <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>
                
                {completion.totalCards !== null && (
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold uppercase tracking-wider">Progress</span>
                      <span className="text-xl font-mono font-bold">{completion.completionPct?.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out relative" 
                        style={{ width: `${completion.completionPct || 0}%` }} 
                      >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-accent/30 p-4 rounded-md border border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Set Value (Owned)</div>
                    <div className="text-xl font-mono font-bold">{formatCurrency(completion.totalValue)}</div>
                  </div>
                  <div className="bg-accent/30 p-4 rounded-md border border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Cost Basis</div>
                    <div className="text-xl font-mono font-bold text-muted-foreground">{formatCurrency(completion.totalCost)}</div>
                  </div>
                  <div className="bg-accent/30 p-4 rounded-md border border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Gain/Loss</div>
                    <div className={`text-xl font-mono font-bold ${completion.totalValue - completion.totalCost >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {completion.totalValue - completion.totalCost >= 0 ? '+' : ''}{formatCurrency(completion.totalValue - completion.totalCost)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Cards in Vault ({completion.ownedCards.length})</h3>
                  
                  {completion.ownedCards.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <p>No cards from this set found in your vault.</p>
                      <p className="text-sm mt-1">Make sure the brand and year match your tracked set.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {completion.ownedCards.map(item => (
                        <div key={item.collectionItemId} className="flex gap-3 p-3 bg-accent/20 rounded-md border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate" title={item.card.name}>{item.card.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono bg-background border border-border px-1 rounded text-muted-foreground">#{item.card.cardNumber}</span>
                              {item.condition && <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{item.condition}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <div className="flex items-center gap-1 bg-success/10 text-success px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                              <CheckCircle2 className="w-3 h-3" /> Owned
                            </div>
                            <div className="font-mono text-sm font-bold mt-2">
                              {formatCurrency(item.currentValue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
              </div>
            ) : null}
          </div>
          
        </div>
      )}

      <AddSetDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onSuccess={fetchSets}
      />
    </div>
  );
}

function AddSetDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const fd = new FormData(e.currentTarget);
    const data = {
      setName: fd.get('setName') as string,
      brand: fd.get('brand') as string,
      year: fd.get('year') ? parseInt(fd.get('year') as string) : undefined,
      sport: fd.get('sport') as string || undefined,
      totalCards: fd.get('totalCards') ? parseInt(fd.get('totalCards') as string) : undefined,
      notes: fd.get('notes') as string || undefined,
    };
    
    try {
      const r = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || 'Failed to add set');
      }
      
      toast.success("Set tracking added");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wider font-bold">Track New Set</DialogTitle>
          <DialogDescription>
            Define a set goal. The app will automatically find matching cards in your Vault.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="setName" className="text-xs uppercase font-bold tracking-wider">Set Name <span className="text-destructive">*</span></Label>
            <Input id="setName" name="setName" placeholder="e.g. Base Set, Prizm, Chrome" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-xs uppercase font-bold tracking-wider">Brand <span className="text-destructive">*</span></Label>
            <Input id="brand" name="brand" placeholder="e.g. Topps, Panini, Fleer" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-xs uppercase font-bold tracking-wider">Year</Label>
              <Input id="year" name="year" type="number" placeholder="e.g. 1986" className="font-mono" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sport" className="text-xs uppercase font-bold tracking-wider">Sport</Label>
              <Select name="sport">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baseball">Baseball</SelectItem>
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Hockey">Hockey</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="totalCards" className="text-xs uppercase font-bold tracking-wider">Total Cards in Set</Label>
            <Input id="totalCards" name="totalCards" type="number" min={1} placeholder="e.g. 132" className="font-mono" />
            <p className="text-[10px] text-muted-foreground">How many cards are in the complete set? Optional.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs uppercase font-bold tracking-wider">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Optional notes..." className="resize-none" rows={2} />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="uppercase font-bold tracking-wider text-xs">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Start Tracking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
