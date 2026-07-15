import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, ShoppingCart, TrendingUp, Edit2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "@/lib/apiFetch";

export default function CardTimeline() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await apiFetch(`/api/collection/${id}/timeline`);
        if (!res.ok) throw new Error("Failed to fetch timeline");
        const json = await res.json();
        
        // Ensure history is sorted ascending
        if (json.history) {
          json.history.sort((a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        }
        
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading timeline");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchTimeline();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-destructive font-mono">{error || "Not found"}</p>
        <Button variant="outline" onClick={() => navigate("/collection")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
        </Button>
      </div>
    );
  }

  const { item, history } = data;
  const c = item.card;
  
  // Stats
  const trueCost = item.trueCost || item.purchasePrice || 0;
  const allTimeHigh = history.length > 0 ? Math.max(...history.map((h: any) => h.price)) : item.currentValue;
  const totalGain = item.currentValue - trueCost;
  const gainPercent = trueCost > 0 ? (totalGain / trueCost) * 100 : 0;
  
  // Format history for chart (need MMM D)
  const chartData = history.map((h: any) => {
    const d = new Date(h.recordedAt);
    const m = d.toLocaleString('default', { month: 'short' });
    return {
      ...h,
      dateFormatted: `${m} ${d.getDate()}`
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Row */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit -ml-4 text-muted-foreground" onClick={() => navigate("/collection")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{c.name || "Unknown"}</h1>
            <p className="text-xl text-muted-foreground mt-1">
              {c.year} {c.brand} {c.cardSet} {c.cardNumber ? `#${c.cardNumber}` : ""}
            </p>
          </div>
          <div className="bg-success/10 text-success border border-success/20 px-4 py-2 rounded-md font-mono text-2xl font-bold">
            {formatCurrency(item.currentValue)}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Acquired Cost</p>
          <p className="text-xl font-mono font-bold">{formatCurrency(trueCost)}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Value</p>
          <p className="text-xl font-mono font-bold">{formatCurrency(item.currentValue)}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">All-time High</p>
          <p className="text-xl font-mono font-bold">{formatCurrency(allTimeHigh)}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Return</p>
          <div className="flex items-center gap-2">
            <p className={`text-xl font-mono font-bold ${totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
            </p>
            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-sm ${totalGain >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {totalGain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold mb-6">Price History</h2>
          <div className="flex-1 w-full relative">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="dateFormatted" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${val}`} 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-mono)' }}
                    formatter={(value: number, name: string, props: any) => [
                      formatCurrency(value), 
                      `Price (${props.payload.source})`
                    ]}
                    labelFormatter={(label) => label}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-semibold text-foreground">Not enough history to chart yet</p>
                <p className="text-sm mt-1 max-w-sm">Prices will appear here as eBay syncs over time or when manual updates are made.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Timeline List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-6">Activity</h2>
          <div className="relative pl-6 border-l border-border/50 space-y-8">
            {history.slice().reverse().map((evt: any, i: number, arr: any[]) => {
              const d = new Date(evt.recordedAt);
              const formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              
              // Change from previous (next in reversed array)
              const prev = arr[i + 1];
              let changeEl = null;
              
              if (prev) {
                const diff = evt.price - prev.price;
                const perc = prev.price > 0 ? (diff / prev.price) * 100 : 0;
                
                if (Math.abs(diff) > 0.001) { // ignore tiny rounding differences
                  const isPos = diff > 0;
                  changeEl = (
                    <div className={`text-xs font-mono font-medium ${isPos ? 'text-success' : 'text-destructive'} mt-1`}>
                      {isPos ? '+' : ''}{formatCurrency(diff)} ({isPos ? '+' : ''}{perc.toFixed(1)}%)
                    </div>
                  );
                }
              }

              let Icon = TrendingUp;
              let dotColor = "bg-blue-500";
              
              if (evt.source === "acquired") {
                Icon = ShoppingCart;
                dotColor = "bg-green-500";
              } else if (evt.source === "manual") {
                Icon = Edit2;
                dotColor = "bg-amber-500";
              }

              return (
                <div key={evt.id} className="relative">
                  <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-card ${dotColor}`} />
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formattedDate}</span>
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {formatCurrency(evt.price)}
                  </div>
                  {changeEl}
                  {evt.note && (
                    <p className="text-xs text-muted-foreground mt-2 bg-accent/50 p-2 rounded border border-border/50 inline-block">
                      {evt.note}
                    </p>
                  )}
                </div>
              );
            })}
            
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No events recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
