"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pause, Play, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/ui/confirm-delete-dialog"; // using updated flexible component

export function AssignmentsTab({
  assignments,
  loading,
  onRefresh,
}: {
  assignments: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [actionTarget, setActionTarget] = useState<{ type: "pause" | "resume" | "cancel"; assignment: any } | null>(null);

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { type, assignment } = actionTarget;
    const newStatus = type === "pause" ? "paused" : type === "resume" ? "active" : "cancelled";

    const res = await fetch(`/api/follow-ups/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update");
    }
    toast.success(`Assignment ${newStatus}`);
    onRefresh();
  };

  const openActionDialog = (type: "pause" | "resume" | "cancel", assignment: any) => {
    setActionTarget({ type, assignment });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-xl border border-white/10">
        <p className="text-muted-foreground">No active follow-up assignments.</p>
      </div>
    );
  }

  const dialogProps = actionTarget
  ? {
      open: true,
      onClose: () => setActionTarget(null),
      onConfirm: handleConfirmAction,
      title: `${actionTarget.type === "pause" ? "Pause" : actionTarget.type === "resume" ? "Resume" : "Cancel"} Assignment?`,
      description: `Are you sure you want to ${actionTarget.type} this assignment?`,
      confirmLabel: actionTarget.type === "pause" ? "Pause" : actionTarget.type === "resume" ? "Resume" : "Cancel",
      variant: (actionTarget.type === "cancel" ? "destructive" : "default") as "destructive" | "default" | "outline" | "secondary",
      icon: actionTarget.type === "cancel" ? <XCircle className="w-5 h-5 text-red-500" /> : <Pause className="w-5 h-5 text-yellow-500" />,
    }
  : null;

  return (
    <div className="space-y-3">
      {assignments.map((assign) => (
        <Card key={assign.id} className="border-white/10 bg-card/70 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{assign.follow_up_sequences?.name || "Sequence"}</p>
              <p className="text-xs text-muted-foreground">
                {assign.clients?.client_name || "No client"} â€¢ Step {assign.current_step_index + 1} of {assign.follow_up_sequences?.steps?.length || "?"}
              </p>
              {assign.next_scheduled_at && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Next: {new Date(assign.next_scheduled_at).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`capitalize ${
                assign.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                assign.status === "paused" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                "bg-gray-500/10 text-gray-400 border-gray-500/20"
              }`}>
                {assign.status}
              </Badge>

              {/* Pause/Resume Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openActionDialog(assign.status === "active" ? "pause" : "resume", assign)}
                disabled={assign.status === "completed" || assign.status === "cancelled"}
              >
                {assign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              {/* Cancel Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400"
                onClick={() => openActionDialog("cancel", assign)}
                disabled={assign.status === "completed" || assign.status === "cancelled"}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Confirmation Dialog */}
      {dialogProps && <ConfirmActionDialog {...dialogProps} />}
    </div>
  );
}