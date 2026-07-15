import { useState, useRef } from "react";
import { useScanCard, getGetCollectionQueryKey, getGetWishlistQueryKey, getGetCollectionSummaryQueryKey, useAddToCollection, useAddToWishlist } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan as ScanIcon, Upload, Loader2, Camera, AlertTriangle, PenLine, CheckCircle2, TrendingUp } from "lucide-react";
import { Card as CardType } from "@workspace/api-client-react/api.schemas";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/apiFetch";

interface EbayComps {
  medianPrice: number | null;
  averagePrice: number | null;
  sampleSize: number;
  searchQuery: string;
  topComp: { title: string; price: number; soldDate: string; listingUrl: string } | null;
}

// Editable fields that represent a card
interface CardFields {
  player: string;
  year: string;
  brand: string;
  cardSet: string;
  cardNumber: string;
  sport: string;
  estimatedValue: string;
  condition: string;
  rookieCard: boolean;
  serialNumbered: boolean;
  description: string;
}

const EMPTY_FIELDS: CardFields = {
  player: "",
  year: "",
  brand: "",
  cardSet: "",
  cardNumber: "",
  sport: "",
  estimatedValue: "",
  condition: "",
  rookieCard: false,
  serialNumbered: false,
  description: "",
};

function cardToFields(card: CardType): CardFields {
  return {
    player: card.player ?? "",
    year: card.year ? String(card.year) : "",
    brand: card.brand ?? "",
    cardSet: card.cardSet ?? "",
    cardNumber: card.cardNumber ?? "",
    sport: card.sport ?? "",
    estimatedValue: card.estimatedValue ? String(card.estimatedValue) : "",
    condition: card.condition ?? "",
    rookieCard: card.rookieCard ?? false,
    serialNumbered: card.serialNumbered ?? false,
    description: card.description ?? "",
  };
}

const SPORTS = ["Baseball", "Basketball", "Football", "Hockey", "Soccer", "Other"];

// ---- Editable Card Form ----
interface CardFormProps {
  fields: CardFields;
  onChange: (fields: CardFields) => void;
  heading: string;
  subheading?: string;
  ebayComps?: EbayComps | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function CardForm({ fields, onChange, heading, subheading, ebayComps, onConfirm, onCancel, isSaving }: CardFormProps) {
  const set = (key: keyof CardFields, val: string | boolean) =>
    onChange({ ...fields, [key]: val });

  const missingWarnings: string[] = [];
  if (!fields.year) missingWarnings.push("Year not found on card — please verify and enter");
  if (!fields.brand) missingWarnings.push("Brand not found on card — please verify and enter");
  if (!fields.cardSet) missingWarnings.push("Card set not found — please verify and enter");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{heading}</h2>
        {subheading && <p className="text-sm text-muted-foreground mt-0.5">{subheading}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Player / Subject</Label>
          <Input
            data-testid="input-player"
            value={fields.player}
            onChange={(e) => set("player", e.target.value)}
            placeholder="e.g. Michael Jordan"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Year</Label>
          <Input
            data-testid="input-year"
            type="number"
            value={fields.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="e.g. 1986"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sport</Label>
          <select
            data-testid="select-sport"
            value={fields.sport}
            onChange={(e) => set("sport", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Select sport</option>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Brand</Label>
          <Input
            data-testid="input-brand"
            value={fields.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Topps, Panini"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Card Set</Label>
          <Input
            data-testid="input-card-set"
            value={fields.cardSet}
            onChange={(e) => set("cardSet", e.target.value)}
            placeholder="e.g. Fleer Basketball"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Card Number</Label>
          <Input
            data-testid="input-card-number"
            value={fields.cardNumber}
            onChange={(e) => set("cardNumber", e.target.value)}
            placeholder="e.g. #57"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Market Value ($)</Label>
          {ebayComps && ebayComps.sampleSize > 0 ? (
            <div className="flex flex-col gap-0.5 pb-1">
              <span className="inline-flex items-center gap-1 w-fit text-xs font-mono bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-sm">
                <TrendingUp className="w-3 h-3" /> eBay median: {formatCurrency((ebayComps.medianPrice ?? ebayComps.averagePrice) || 0)} · {ebayComps.sampleSize} recent sales
              </span>
              <span className="text-[10px] text-muted-foreground">Search: "{ebayComps.searchQuery}"</span>
            </div>
          ) : (
            <div className="pb-1">
              <span className="inline-flex items-center gap-1 w-fit text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-sm">
                <AlertTriangle className="w-3 h-3" /> No eBay sales found — enter value manually
              </span>
            </div>
          )}
          <Input
            data-testid="input-estimated-value"
            type="number"
            step="0.01"
            value={fields.estimatedValue}
            onChange={(e) => set("estimatedValue", e.target.value)}
            placeholder="e.g. 250.00"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Condition / Grade</Label>
          <Input
            data-testid="input-condition"
            value={fields.condition}
            onChange={(e) => set("condition", e.target.value)}
            placeholder="e.g. PSA 9, Raw NM"
          />
        </div>

        <div className="col-span-2 flex gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="checkbox-rookie">
            <input
              type="checkbox"
              checked={fields.rookieCard}
              onChange={(e) => set("rookieCard", e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">Rookie Card (RC)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="checkbox-serial">
            <input
              type="checkbox"
              checked={fields.serialNumbered}
              onChange={(e) => set("serialNumbered", e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">Serial Numbered</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <div className="flex-1 flex flex-col justify-end">
          {missingWarnings.length > 0 && (
            <div className="space-y-1 pb-2">
              {missingWarnings.map(w => (
                <p key={w} className="flex items-center gap-1.5 text-xs text-amber-500">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}
          <Button className="w-full font-bold uppercase tracking-wider" onClick={onConfirm} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirm Card
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Add to collection/wishlist dialog ----
interface SaveDialogProps {
  card: CardType;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function SaveDialog({ card, open, onOpenChange }: SaveDialogProps) {
  const [mode, setMode] = useState<"collection" | "wishlist">("collection");
  const [price, setPrice] = useState(String(card.estimatedValue ?? ""));
  const [condition, setCondition] = useState("");
  const addToCollection = useAddToCollection();
  const addToWishlist = useAddToWishlist();
  const queryClient = useQueryClient();

  const isPending = addToCollection.isPending || addToWishlist.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "collection") {
      addToCollection.mutate(
        { data: { cardId: card.id, purchasePrice: parseFloat(price) || 0, quantity: 1, condition } },
        {
          onSuccess: () => {
            toast.success("Added to Vault");
            queryClient.invalidateQueries({ queryKey: getGetCollectionQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCollectionSummaryQueryKey() });
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to add"),
        }
      );
    } else {
      addToWishlist.mutate(
        { data: { cardId: card.id, targetPrice: parseFloat(price) || undefined, notes: condition } },
        {
          onSuccess: () => {
            toast.success("Added to Wishlist");
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to add"),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Card</DialogTitle>
          </DialogHeader>

          <div className="py-5 space-y-4">
            <div className="bg-muted rounded-md p-3 border border-border text-sm">
              <p className="font-bold">{card.name}</p>
              <p className="text-muted-foreground font-mono text-xs mt-0.5">
                {card.year} · {card.brand} · {card.cardSet}
                {card.cardNumber ? ` · ${card.cardNumber}` : ""}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-md overflow-hidden border border-border">
              <button
                type="button"
                data-testid="tab-collection"
                className={cn("flex-1 py-2 text-sm font-semibold transition-colors", mode === "collection" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent")}
                onClick={() => setMode("collection")}
              >
                My Collection
              </button>
              <button
                type="button"
                data-testid="tab-wishlist"
                className={cn("flex-1 py-2 text-sm font-semibold transition-colors", mode === "wishlist" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent")}
                onClick={() => setMode("wishlist")}
              >
                Wishlist
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {mode === "collection" ? "Purchase Price ($)" : "Target Price ($)"}
              </Label>
              <Input
                data-testid="input-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {mode === "collection" ? "Grade / Condition" : "Notes"}
              </Label>
              <Input
                data-testid="input-notes"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder={mode === "collection" ? "e.g. PSA 10, Raw NM" : "e.g. Looking under $50"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="font-bold uppercase tracking-wider px-6">
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "collection" ? "Add to Vault" : "Add to Hunt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Page ----
type Stage =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "edit"; fields: CardFields; imagePreview: string | null; aiNotes: string | null; ebayComps: EbayComps | null }
  | { kind: "manual" }
  | { kind: "done"; card: CardType };

export default function Scan() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanMutation = useScanCard();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setStage({ kind: "scanning" });

      const base64Data = base64String.split(",")[1];
      scanMutation.mutate(
        { data: { imageBase64: base64Data, mimeType: file.type } },
        {
          onSuccess: (result) => {
            if (result.card) {
              const comps = result.ebayComps as EbayComps | null;
              setStage({
                kind: "edit",
                fields: cardToFields(result.card),
                imagePreview: base64String,
                aiNotes: result.notes ?? null,
                ebayComps: comps ?? null,
              });
              if (comps && comps.sampleSize > 0) {
                toast.success(`Card identified · eBay price sourced from ${comps.sampleSize} recent sales`);
              } else {
                toast.success("Card identified · No eBay price found, enter value manually");
              }
            } else {
              setStage({ kind: "edit", fields: EMPTY_FIELDS, imagePreview: base64String, aiNotes: result.notes ?? null, ebayComps: null });
              toast.error("Could not identify card. Fill in the details manually.");
            }
          },
          onError: () => {
            setStage({ kind: "edit", fields: EMPTY_FIELDS, imagePreview: base64String, aiNotes: null, ebayComps: null });
            toast.error("Scan failed. You can fill in the details manually.");
          },
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setStage({ kind: "idle" });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmCard = async (fields: CardFields) => {
    setIsSaving(true);
    try {
      const res = await apiFetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: fields.player || undefined,
          year: fields.year ? parseInt(fields.year) : undefined,
          brand: fields.brand,
          cardSet: fields.cardSet,
          cardNumber: fields.cardNumber || undefined,
          sport: fields.sport,
          estimatedValue: fields.estimatedValue ? parseFloat(fields.estimatedValue) : 0,
          condition: fields.condition || undefined,
          rookieCard: fields.rookieCard,
          serialNumbered: fields.serialNumbered,
          description: fields.description || undefined,
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      const card: CardType = await res.json();
      setStage({ kind: "done", card });
      setSaveDialogOpen(true);
    } catch {
      toast.error("Failed to save card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Identification</h1>
          <p className="text-muted-foreground mt-1">Upload a photo or enter details manually.</p>
        </div>
        <Button
          variant="outline"
          data-testid="button-manual-entry"
          onClick={() => setStage({ kind: "manual" })}
          className="flex items-center gap-2 font-semibold"
        >
          <PenLine className="w-4 h-4" />
          Enter Manually
        </Button>
      </div>

      {/* Manual entry */}
      {stage.kind === "manual" && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-2xl">
          <EditStageForm
            initialFields={EMPTY_FIELDS}
            ebayComps={null}
            heading="Manual Card Entry"
            subheading="Type in the card details and confirm to add it to your library."
            onConfirm={handleConfirmCard}
            onCancel={handleReset}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Upload + scan flow */}
      {(stage.kind === "idle" || stage.kind === "scanning") && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Drop zone */}
          <div className="space-y-4">
            <div
              className={cn(
                "relative aspect-[3/4] rounded-lg border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-colors",
                imagePreview ? "border-primary" : "border-border bg-accent/30 hover:bg-accent/50 cursor-pointer"
              )}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Card preview" className="w-full h-full object-cover" />
                  {stage.kind === "scanning" && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                      </div>
                      <p className="mt-4 font-mono font-bold tracking-widest text-primary animate-pulse">ANALYZING...</p>
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
                    JPG · PNG accepted
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {imagePreview && stage.kind !== "scanning" && (
              <Button variant="outline" className="w-full" onClick={handleReset}>
                <ScanIcon className="w-4 h-4 mr-2" /> Scan Another Card
              </Button>
            )}
          </div>

          {/* Awaiting state */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex items-center justify-center">
            <div className="text-center text-muted-foreground opacity-50">
              <ScanIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="font-mono text-sm uppercase tracking-widest">Awaiting Input</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit stage — show image + editable form side by side */}
      {stage.kind === "edit" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {stage.imagePreview ? (
              <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border">
                <img src={stage.imagePreview} alt="Card" className="w-full h-full object-cover" />
              </div>
            ) : null}
            {stage.aiNotes && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{stage.aiNotes}</span>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={handleReset}>
              <ScanIcon className="w-4 h-4 mr-2" /> Scan Another Card
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <EditStageForm
              initialFields={stage.fields}
              ebayComps={stage.ebayComps}
              onConfirm={handleConfirmCard}
              onCancel={handleReset}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      {/* Done — card saved, prompt to add to collection/wishlist */}
      {stage.kind === "done" && (
        <div className="max-w-lg mx-auto bg-card border border-border rounded-lg p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Card Saved</h2>
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              {stage.card.name}
            </p>
          </div>
          <div className="text-2xl font-mono font-bold">{formatCurrency(stage.card.estimatedValue)}</div>
          <div className="flex gap-3">
            <Button className="flex-1 font-bold uppercase tracking-wider" onClick={() => setSaveDialogOpen(true)}>
              Add to Vault / Wishlist
            </Button>
            <Button variant="outline" onClick={handleReset}>Scan Another</Button>
          </div>
        </div>
      )}

      {stage.kind === "done" && saveDialogOpen && (
        <SaveDialog card={stage.card} open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
      )}
    </div>
  );
}

// Stateful wrapper so CardForm has isolated state
function EditStageForm({
  initialFields,
  heading = "Review & Correct",
  subheading = "AI filled these in — fix anything that's wrong, then confirm.",
  ebayComps,
  onConfirm,
  onCancel,
  isSaving,
}: {
  initialFields: CardFields;
  heading?: string;
  subheading?: string;
  ebayComps?: EbayComps | null;
  onConfirm: (f: CardFields) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [fields, setFields] = useState<CardFields>(initialFields);
  return (
    <CardForm
      fields={fields}
      onChange={setFields}
      heading={heading}
      subheading={subheading}
      ebayComps={ebayComps}
      onConfirm={() => onConfirm(fields)}
      onCancel={onCancel}
      isSaving={isSaving}
    />
  );
}
