"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock, Plus, Mail, Link2, Loader2 } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ui/confirm-delete-dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Sequence {
  id: string;
  name: string;
  trigger_type: string;
  steps: any[];
  is_default: boolean;
  created_at: string;
}

export function SequencesTab({
  sequences,
  loading,
  onEdit,
  onRefresh,
}: {
  sequences: Sequence[];
  loading: boolean;
  onEdit: (seq: Sequence) => void;
  onRefresh: () => void;
}) {
  const [deleteTarget, setDeleteTarget] = useState<Sequence | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(true);

  useEffect(() => {
    checkEmailConnection();
  }, []);

  const checkEmailConnection = async () => {
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/connections?provider=google_gmail");
      if (res.ok) {
        const data = await res.json();
        setEmailConnected(data.connected);
      } else {
        setEmailConnected(false);
      }
    } catch (err) {
      console.error("Failed to check email connection");
      setEmailConnected(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSendTest = async (sequenceId: string) => {
    if (!emailConnected) {
      toast.error("Please connect your Gmail first.", {
        description: "You'll be redirected to the connections page.",
        action: {
          label: "Connect",
          onClick: () => (window.location.href = "/settings/connections"),
        },
      });
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/settings/connections";
      }, 1500);
      return;
    }

    const email = prompt("Enter your email to receive test follow-up:");
    if (!email) return;

    const res = await fetch("/api/follow-ups/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence_id: sequenceId, to_email: email }),
    });

    if (res.ok) {
      toast.success("Test email sent to " + email);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to send test");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/follow-ups/sequences/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Sequence deleted");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Loading sequences...
      </div>
    );
  }

  if (sequences.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-xl border border-white/10">
        <p className="text-muted-foreground">
          No sequences yet. Create your first follow-up sequence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Email Connection Status Banner */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {checkingEmail ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : emailConnected ? (
            <Mail className="h-4 w-4 text-emerald-400" />
          ) : (
            <Link2 className="h-4 w-4 text-yellow-400" />
          )}
          <span className="text-xs">
            {emailConnected
              ? "Gmail connected â€“ test emails will be sent from your address."
              : "Gmail not connected â€“ test emails require your Gmail."}
          </span>
        </div>
        {!emailConnected && !checkingEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/settings/connections")}
            className="text-xs"
          >
            Connect
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sequences.map((seq) => (
          <Card key={seq.id} className="border-white/10 bg-card/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {seq.name}
                    {seq.is_default && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/20">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Trigger:{" "}
                    <span className="capitalize">
                      {seq.trigger_type.replace("_", " ")}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(seq)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400"
                    onClick={() => setDeleteTarget(seq)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendTest(seq.id)}
                  >
                    Send Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {seq.steps?.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Clock className="h-3 w-3" />
                    <span>Day {step.interval_days}</span>
                    <span className="truncate">- {step.subject}</span>
                    {step.use_ai && (
                      <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                        AI
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmActionDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Sequence?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}