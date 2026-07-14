import { useState } from "react";
import { useSearchCards } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardDisplay } from "@/components/CardDisplay";
import { Search as SearchIcon, Loader2, Filter, Plus, Star } from "lucide-react";
import { AddCardDialog } from "@/components/AddCardDialog";
import { Card as CardType } from "@workspace/api-client-react/api.schemas";

export default function Search() {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("all");
  const [year, setYear] = useState("");
  
  // Debounce could be added here, but for now we'll trigger on change or submit
  const [activeParams, setActiveParams] = useState({ q: "", sport: "", year: undefined as number | undefined });

  const { data, isLoading } = useSearchCards(
    activeParams, 
    { 
      query: { 
        enabled: true, 
        queryKey: ['searchCards', activeParams] 
      } 
    }
  );

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [dialogMode, setDialogMode] = useState<'collection' | 'wishlist'>('collection');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveParams({
      q: query,
      sport: sport === "all" ? "" : sport,
      year: year ? parseInt(year) : undefined
    });
  };

  const openDialog = (card: CardType, mode: 'collection' | 'wishlist') => {
    setSelectedCard(card);
    setDialogMode(mode);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Card Database</h1>
        <p className="text-muted-foreground">Search and discover cards to add to your vault.</p>
      </div>

      <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by player, brand, set..." 
              className="pl-9 bg-background h-10 font-mono text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="w-32">
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="h-10 bg-background font-mono text-xs font-semibold uppercase tracking-wider">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="Baseball">Baseball</SelectItem>
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                  <SelectItem value="Hockey">Hockey</SelectItem>
                  <SelectItem value="TCG">TCG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Input 
              placeholder="Year" 
              className="w-24 bg-background h-10 font-mono text-sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              maxLength={4}
            />
            
            <Button type="submit" className="h-10 px-6 font-semibold uppercase tracking-wider text-xs hover-elevate">
              Search
            </Button>
          </div>
        </form>
      </div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.cards && data.cards.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm font-mono text-muted-foreground">
              FOUND {data.total} ASSETS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.cards.map((card) => (
                <CardDisplay 
                  key={card.id} 
                  card={card}
                  onClick={() => openDialog(card, 'collection')}
                  actionButton={
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8 rounded-full hover:bg-secondary hover:text-secondary-foreground"
                        title="Add to Wishlist"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog(card, 'wishlist');
                        }}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        title="Add to Collection"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog(card, 'collection');
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        ) : activeParams.q || activeParams.sport || activeParams.year ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-accent/30">
            <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-semibold text-foreground text-lg">No assets found</p>
            <p className="text-sm mt-1 max-w-sm">Try adjusting your search parameters to locate specific cards.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-accent/30">
            <Filter className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-semibold text-foreground text-lg">Search the Database</p>
            <p className="text-sm mt-1 max-w-sm">Enter a player name, set, or brand to begin scouting cards.</p>
          </div>
        )}
      </div>

      {selectedCard && (
        <AddCardDialog 
          card={selectedCard} 
          mode={dialogMode} 
          open={!!selectedCard} 
          onOpenChange={(open) => !open && setSelectedCard(null)} 
        />
      )}
    </div>
  );
}
