// components/ProposalHeader.tsx
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export function ProposalHeader() {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
      <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
        G
      </div>
      <div className="flex-1">
        <h2 className="text-base font-semibold heading-gradient">Project Proposal</h2>
        <p className="text-[11px] text-muted-foreground">Prepared by GigThink AI • Confidential</p>
      </div>
      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2">AI Generated</Badge>
    </div>
  );
}