import { useState, useRef } from "react";
import { useScanCard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CardDisplay } from "@/components/CardDisplay";
import { Scan as ScanIcon, Upload, Loader2, Camera, AlertTriangle } from "lucide-react";
import { AddCardDialog } from "@/components/AddCardDialog";
import { CardScanResult } from "@workspace/api-client-react/api.schemas";
import { toast } from "sonner";

export default function Scan() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [dialogMode, setDialogMode] = useState<'collection' | 'wishlist' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanMutation = useScanCard();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setScanResult(null); // Reset previous result
      
      // Extract just the base64 part (remove data:image/jpeg;base64,)
      const base64Data = base64String.split(',')[1];
      
      // Run scan
      scanMutation.mutate({
        data: {
          imageBase64: base64Data,
          mimeType: file.type
        }
      }, {
        onSuccess: (result) => {
          setScanResult(result);
          if (!result.identified) {
            toast.error("Could not confidently identify this card.");
          } else {
            toast.success("Card identified successfully!");
          }
        },
        onError: () => {
          toast.error("Scan failed. Please try again.");
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImagePreview(null);
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Identification</h1>
        <p className="text-muted-foreground">Upload a photo to automatically identify and appraise a card.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Scanner Area */}
        <div className="space-y-4">
          <div 
            className={`relative aspect-[3/4] rounded-lg border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-colors
              ${imagePreview ? 'border-primary' : 'border-border bg-accent/30 hover:bg-accent/50 cursor-pointer'}`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Card preview" className="w-full h-full object-cover" />
                {scanMutation.isPending && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <div className="w-16 h-16 relative">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 font-mono font-bold tracking-widest text-primary animate-pulse">ANALYZING ASSET...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-6 text-muted-foreground flex flex-col items-center">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">Upload Photo</h3>
                <p className="text-sm">Click to browse or take a picture</p>
                <div className="mt-6 px-4 py-2 bg-background rounded-md text-xs font-mono uppercase tracking-wider shadow-sm border border-border">
                  JPG, PNG accepted
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {imagePreview && !scanMutation.isPending && (
            <Button variant="outline" className="w-full" onClick={handleReset}>
              <ScanIcon className="w-4 h-4 mr-2" /> Scan Another Card
            </Button>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2 border-b border-border pb-4">
            <ScanIcon className="w-5 h-5 text-primary" /> Scan Results
          </h2>

          {scanMutation.isPending ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 py-12">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="font-mono text-sm">Querying database...</p>
            </div>
          ) : scanResult ? (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              {scanResult.identified && scanResult.card ? (
                <>
                  <div className="mb-4 inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-sm w-fit text-sm font-bold tracking-wider uppercase font-mono">
                    Match Found <span className="opacity-70 text-xs">{(parseFloat(scanResult.confidence || "0") * 100).toFixed(1)}% CONFIDENCE</span>
                  </div>
                  
                  <div className="mb-8 flex-1">
                    <CardDisplay card={scanResult.card} />
                  </div>
                  
                  <div className="flex gap-4 mt-auto">
                    <Button 
                      className="flex-1 font-bold uppercase tracking-wider" 
                      onClick={() => setDialogMode('collection')}
                    >
                      Add to Vault
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 font-bold uppercase tracking-wider"
                      onClick={() => setDialogMode('wishlist')}
                    >
                      Track Asset
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Identification Failed</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mt-1">
                      {scanResult.notes || "The AI couldn't confidently identify this card. Try better lighting or a clearer angle."}
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={handleReset}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12 opacity-50">
              <ScanIcon className="w-16 h-16 mb-4" />
              <p className="font-mono text-sm uppercase tracking-widest">Awaiting Input</p>
            </div>
          )}
        </div>
      </div>

      {dialogMode && scanResult?.card && (
        <AddCardDialog 
          card={scanResult.card} 
          mode={dialogMode} 
          open={!!dialogMode} 
          onOpenChange={(open) => !open && setDialogMode(null)} 
        />
      )}
    </div>
  );
}
