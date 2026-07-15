import { useState, useRef, useEffect } from "react";
import { useGetCollectionSummary, useGetPortfolioHistory, useGetCollection, useGetWishlist, getGetCollectionQueryKey, getGetCollectionSummaryQueryKey, getGetPortfolioHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, Plus, Star, RefreshCw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardDisplay } from "@/components/CardDisplay";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetCollectionSummary();
  const { data: history, isLoading: isLoadingHistory } = useGetPortfolioHistory();
  const { data: collection, isLoading: isLoadingCollection } = useGetCollection();
  const { data: wishlist, isLoading: isLoadingWishlist } = useGetWishlist();
  
  const queryClient = useQueryClient();
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const { data: refreshStatus } = useQuery({
    queryKey: ['collection-refresh-status'],
    queryFn: async () => {
      const r = await apiFetch('/api/collection/refresh-status');
      return r.json() as Promise<{ isRunning: boolean; lastRunAt: string | null; nextRunAt: string | null; lastResult: { updated: number; failed: number; total: number } | null }>;
    },
    refetchInterval: 30_000,
  });

  const prevIsRunning = useRef(false);
  useEffect(() => {
    if (prevIsRunning.current && !refreshStatus?.isRunning) {
      queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCollectionSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPortfolioHistoryQueryKey() });
    }
    
    // Clear manual refreshing state if status says we aren't running
    if (refreshStatus && !refreshStatus.isRunning && manualRefreshing) {
      // Small delay to prevent flashing if the manual refresh was just clicked
      // and the immediate invalidation hasn't set isRunning to true yet
      const timer = setTimeout(() => setManualRefreshing(false), 2000);
      return () => clearTimeout(timer);
    }
    
    prevIsRunning.current = refreshStatus?.isRunning ?? false;
  }, [refreshStatus?.isRunning, queryClient, manualRefreshing]);

  const isRefreshing = manualRefreshing || refreshStatus?.isRunning;

  const handleRefreshPrices = async () => {
    setManualRefreshing(true);
    try {
      const res = await apiFetch('/api/collection/refresh-prices', { method: 'POST' });
      if (!res.ok) throw new Error("Failed to start refresh");
      queryClient.invalidateQueries({ queryKey: ['collection-refresh-status'] });
      toast.success("Price refresh started...");
    } catch {
      toast.error('Refresh failed to start');
      setManualRefreshing(false);
    }
  };

  const isLoading = isLoadingSummary || isLoadingHistory || isLoadingCollection || isLoadingWishlist;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPositive = (summary?.totalGain || 0) >= 0;
  const recentCards = collection?.slice(0, 4) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">Portfolio overview and market movements.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshPrices} 
              disabled={isRefreshing}
              className="font-semibold shadow-sm"
            >
              {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {isRefreshing ? "Syncing…" : "Refresh Prices"}
            </Button>
            <Link href="/scan">
              <Button className="font-semibold shadow-sm hover-elevate">
                <Plus className="w-4 h-4 mr-2" /> Add Card
              </Button>
            </Link>
          </div>
          {refreshStatus?.lastRunAt && !refreshStatus?.isRunning && (
            <p className="text-[10px] text-muted-foreground font-mono mr-1">
              Last synced {timeAgo(refreshStatus.lastRunAt)}
            </p>
          )}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{formatCurrency(summary?.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Cost: {formatCurrency(summary?.totalCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Return</CardTitle>
            {isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-mono font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{formatCurrency(summary?.totalGain)}
            </div>
            <p className={`text-xs mt-1 font-mono font-medium ${isPositive ? 'text-success/80' : 'text-destructive/80'}`}>
              {isPositive ? '+' : ''}{formatPercent(summary?.totalGainPercent)} All Time
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Collection Size</CardTitle>
            <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{summary?.itemCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Cards in Vault</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Wishlist</CardTitle>
            <Star className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{wishlist?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Hunted Cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Value History</CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="snapshotDate" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                    tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-mono)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                    labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-semibold text-foreground">No historical data yet</p>
              <p className="text-sm mt-1 max-w-sm">Add cards to your collection to start tracking your portfolio's value over time.</p>
              <Link href="/search" className="mt-4">
                <Button variant="outline">Search Cards</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Top Gainer & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {summary?.topGainer && (
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-success" />
              <h2 className="text-lg font-bold tracking-tight">Top Gainer</h2>
            </div>
            <CardDisplay 
              card={summary.topGainer.card} 
              footerContent={
                <div className="flex justify-between items-center">
                  <div className="font-mono text-sm text-muted-foreground">
                    Cost: {formatCurrency(summary.topGainer.purchasePrice)}
                  </div>
                  <div className="font-mono text-sm font-bold text-success">
                    +{formatCurrency(summary.topGainer.currentValue - summary.topGainer.purchasePrice)}
                  </div>
                </div>
              }
            />
          </div>
        )}

        <div className={`space-y-4 ${summary?.topGainer ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Recent Additions</h2>
            <Link href="/collection">
              <Button variant="link" className="text-sm h-auto p-0">View All</Button>
            </Link>
          </div>
          
          {recentCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
              {recentCards.map(item => (
                <CardDisplay 
                  key={item.id} 
                  card={item.card} 
                  footerContent={
                    <div className="flex justify-between items-center font-mono text-xs text-muted-foreground">
                      <span>Purchased: {formatCurrency(item.purchasePrice)}</span>
                      <span>{new Date(item.acquiredAt).toLocaleDateString()}</span>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-accent/30">
              <p className="font-semibold text-foreground">Vault is empty</p>
              <p className="text-sm mt-1">Your recent additions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
