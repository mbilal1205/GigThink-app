// components/ProposalFooter.tsx
import { Brain, ArrowRight } from "lucide-react";
export function ProposalFooter({ decision, risk, nextStep }: { decision: string; risk: string; nextStep: string }) {
  return (
    <div className="pt-3 mt-4 border-t border-white/10 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Brain size={14} className="text-primary" />
        <span className="font-medium">AI Decision Engine:</span>
        <span className="text-emerald-400">Decision: {decision}</span>
        <span className="text-yellow-400">| Risk: {risk}</span>
        <ArrowRight size={12} className="text-primary" />
        <span className="text-foreground/80">{nextStep}</span>
      </div>
    </div>
  );
}