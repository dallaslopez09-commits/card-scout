import { Card as CardType } from "@workspace/api-client-react/api.schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export interface CardDisplayProps {
  card: CardType;
  onClick?: () => void;
  actionButton?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function getSportColor(sport: string) {
  const normalized = sport.toLowerCase();
  if (normalized.includes("baseball")) return "from-emerald-700 to-emerald-900";
  if (normalized.includes("basketball")) return "from-orange-500 to-orange-700";
  if (normalized.includes("football")) return "from-amber-700 to-amber-900";
  if (normalized.includes("soccer")) return "from-green-600 to-green-800";
  if (normalized.includes("hockey")) return "from-blue-600 to-blue-800";
  if (normalized.includes("tcg") || normalized.includes("pokemon")) return "from-yellow-400 to-yellow-600";
  return "from-slate-700 to-slate-900";
}

export function CardDisplay({ card, onClick, actionButton, footerContent }: CardDisplayProps) {
  const sportGradient = getSportColor(card.sport);

  return (
    <Card 
      className={`overflow-hidden flex flex-col group transition-all duration-200 border-border shadow-sm hover:shadow-md hover:border-primary/50 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      data-testid={`card-item-${card.id}`}
    >
      <div className={`h-48 w-full bg-gradient-to-br ${sportGradient} relative p-4 flex flex-col justify-between shrink-0`}>
        {/* Placeholder image representation */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] bg-repeat"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white border-0 font-bold uppercase tracking-wider text-[10px]">
            {card.year} {card.brand}
          </Badge>
          {card.rookieCard && (
            <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400 border-0 font-bold uppercase text-[10px]">
              RC
            </Badge>
          )}
        </div>
        
        <div className="relative z-10">
          <h3 className="text-white font-black text-xl leading-tight truncate">
            {card.player || card.name}
          </h3>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide truncate">
            {card.cardSet} {card.cardNumber ? `#${card.cardNumber}` : ''}
          </p>
        </div>
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Est. Value</p>
            <p className="text-lg font-mono font-bold">{formatCurrency(card.estimatedValue)}</p>
          </div>
          {actionButton && (
            <div onClick={(e) => e.stopPropagation()}>
              {actionButton}
            </div>
          )}
        </div>
        
        {footerContent && (
          <div className="mt-auto pt-3 border-t border-border">
            {footerContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
