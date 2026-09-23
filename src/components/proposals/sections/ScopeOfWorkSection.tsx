import { Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { FeatureItem } from "@/components/proposals/proposal-types";

interface ScopeOfWorkSectionProps {
  features?: FeatureItem[];  // Optional banaya
  onUpdate: (features: FeatureItem[]) => void;
}

export function ScopeOfWorkSection({ 
  features = [],  // Default empty array
  onUpdate 
}: ScopeOfWorkSectionProps) {
  return (
    <div className="rounded-2xl border p-4 sm:p-5 space-y-3 bg-background shadow-sm">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Wrench className="h-4.5 w-4.5 text-blue-500" /> 4. Scope of Work & Features Breakdown
      </h3>
      <p className="text-xs text-muted-foreground">
        Modules and features included in the development scope.
      </p>
      <div className="space-y-2 pt-2">
        {features.map((feat, idx) => (
          <div key={idx} className="p-3 border rounded-xl bg-muted/20 space-y-1">
            <Input
              value={feat.moduleName}
              onChange={(e) => {
                const updated = [...features];
                updated[idx] = { ...updated[idx], moduleName: e.target.value };
                onUpdate(updated);
              }}
              className="font-semibold text-xs border-none p-0 h-auto bg-transparent"
              placeholder="Module name"
            />
            <Input
              value={feat.description}
              onChange={(e) => {
                const updated = [...features];
                updated[idx] = { ...updated[idx], description: e.target.value };
                onUpdate(updated);
              }}
              className="text-xs text-muted-foreground border-none p-0 h-auto bg-transparent"
              placeholder="Description"
            />
          </div>
        ))}
      </div>
    </div>
  );
}