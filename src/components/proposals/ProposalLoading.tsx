import { Loader2 } from "lucide-react";

export function ProposalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] space-y-3">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-semibold text-muted-foreground">
        Loading Proposal Workspace...
      </p>
    </div>
  );
}