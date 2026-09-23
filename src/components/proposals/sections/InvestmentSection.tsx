import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BreakdownItem } from "@/components/proposals/proposal-types";

interface InvestmentSectionProps {
  totalCost?: number;  // Optional banaya
  currency?: string;  // Optional banaya
  breakdown?: BreakdownItem[];  // Optional banaya
  onUpdate: (investment: { totalCost: number; currency: string; breakdown: BreakdownItem[] }) => void;
}

export function InvestmentSection({
  totalCost = 0,  // Default value
  currency = "USD",  // Default value
  breakdown = [],  // Default empty array
  onUpdate,
}: InvestmentSectionProps) {
  return (
    <div className="rounded-2xl border p-4 sm:p-5 space-y-3 bg-background shadow-sm">
      <h3 className="text-base font-bold flex items-center gap-2">
        <DollarSign className="h-4.5 w-4.5 text-emerald-500" /> 6. Investment & Financial Commercials
      </h3>
      <p className="text-xs text-muted-foreground">
        Budget breakdown and payment terms.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs font-semibold">Total Cost ({currency}):</span>
        <Input
          type="number"
          value={totalCost}
          onChange={(e) =>
            onUpdate({
              totalCost: Number(e.target.value),
              currency,
              breakdown,
            })
          }
          className="w-32 text-sm font-bold"
        />
      </div>
    </div>
  );
}