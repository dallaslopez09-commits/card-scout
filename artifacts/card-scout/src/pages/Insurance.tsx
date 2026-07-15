import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Download, Printer, Loader2 } from "lucide-react";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Insurance() {
  const [collection, setCollection] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [collRes, summRes] = await Promise.all([
          fetch("/api/collection", { credentials: "include" }),
          fetch("/api/collection/summary", { credentials: "include" })
        ]);
        
        const collData = await collRes.json();
        const summData = await summRes.json();
        
        // Sort collection by currentValue descending
        collData.sort((a: any, b: any) => (b.currentValue || 0) - (a.currentValue || 0));
        
        setCollection(collData);
        setSummary(summData);
      } catch (err) {
        console.error("Failed to fetch insurance data", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Compute sport breakdowns
  const sportStats = collection.reduce((acc: Record<string, { count: number, value: number }>, item) => {
    const sport = item.card?.sport || "(Unsorted)";
    if (!acc[sport]) acc[sport] = { count: 0, value: 0 };
    acc[sport].count += 1;
    acc[sport].value += (item.currentValue || 0);
    return acc;
  }, {});
  
  const sportsList = Object.entries(sportStats).sort((a, b) => b[1].value - a[1].value);

  const handleExportCsv = () => {
    if (!collection.length) return;
    
    const headers = ['Player', 'Year', 'Brand', 'Set', 'Card#', 'Condition', 'Purchase Price', 'Replacement Value', 'eBay Price', 'Acquired Date'];
    
    const rows = collection.map(item => {
      const c = item.card;
      return [
        `"${c.player || c.name || ''}"`,
        `"${c.year || ''}"`,
        `"${c.brand || ''}"`,
        `"${c.cardSet || ''}"`,
        `"${c.cardNumber || ''}"`,
        `"${item.condition || ''}"`,
        item.purchasePrice || 0,
        item.currentValue || 0,
        item.ebayPrice || '',
        new Date(item.acquiredAt).toLocaleDateString()
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, `insurance-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const yyyymmdd = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const reportId = `CS-${yyyymmdd}-${Math.random().toString(16).substring(2, 6)}`;
  
  const totalValue = summary?.totalValue || 0;
  const totalCost = summary?.totalCost || 0;
  const totalGain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-card border border-border p-6 rounded-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insurance Report</h1>
          <p className="text-muted-foreground text-sm">Generate a replacement value document for your insurer.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>
      
      <div className="printable-area max-w-4xl mx-auto bg-white text-black p-8 sm:p-12 rounded-lg shadow-lg">
        <div className="mb-8 border-b-2 border-black pb-6">
          <h1 className="text-3xl font-black tracking-tighter mb-4 uppercase">Card Scout &mdash; Collection Insurance Report</h1>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <p><span className="font-bold">OWNER:</span> {user?.firstName} {user?.lastName || ""}</p>
              <p><span className="font-bold">REPORT DATE:</span> {today}</p>
              <p><span className="font-bold">REPORT ID:</span> {reportId}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold uppercase mb-4 border-b border-black/20 pb-1">Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-sm">
            <div>
              <p className="font-bold text-gray-500 mb-1">Total Cards Listed</p>
              <p className="text-xl">{summary?.itemCount || collection.length}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Replacement Value</p>
              <p className="text-xl">{formatCurrency(totalValue)}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Purchase Cost</p>
              <p className="text-xl">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Potential Gain/Loss</p>
              <p className="text-xl">
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({totalGain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold uppercase mb-4 border-b border-black/20 pb-1">Collection by Sport</h2>
          <div className="space-y-2 font-mono text-sm max-w-md">
            {sportsList.map(([sport, stats]) => (
              <div key={sport} className="flex justify-between">
                <span className="w-32">{sport}</span>
                <span className="w-24 text-right text-gray-500">{stats.count} cards</span>
                <span className="w-32 text-right font-bold">{formatCurrency(stats.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-lg font-bold uppercase mb-4 border-b border-black/20 pb-1">Full Card Inventory</h2>
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Player/Name</th>
                <th className="py-2 pr-2">Year</th>
                <th className="py-2 pr-2">Brand</th>
                <th className="py-2 pr-2">Set</th>
                <th className="py-2 pr-2">Card#</th>
                <th className="py-2 pr-2">Condition</th>
                <th className="py-2 pr-2 text-right">Purchase</th>
                <th className="py-2 pl-2 text-right">Replacement Value</th>
              </tr>
            </thead>
            <tbody>
              {collection.map((item, i) => {
                const c = item.card;
                return (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2 pr-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-2 font-bold">{c.player || c.name || "Unknown"}</td>
                    <td className="py-2 pr-2">{c.year || "-"}</td>
                    <td className="py-2 pr-2">{c.brand || "-"}</td>
                    <td className="py-2 pr-2">{c.cardSet || "-"}</td>
                    <td className="py-2 pr-2">{c.cardNumber || "-"}</td>
                    <td className="py-2 pr-2">{item.condition || "-"}</td>
                    <td className="py-2 pr-2 text-right text-gray-500">{formatCurrency(item.purchasePrice || 0)}</td>
                    <td className="py-2 pl-2 text-right font-bold">{formatCurrency(item.currentValue || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-500 font-mono border-t-2 border-black pt-4">
          <p className="font-bold mb-1 text-black">DISCLAIMER</p>
          <p>This report was generated by Legends &amp; Lunatics Gonzo Grader on {today}. Values shown are based on recent eBay sold comparables and are estimates only. Consult a certified appraiser for formal insurance purposes.</p>
        </div>
      </div>
    </div>
  );
}
