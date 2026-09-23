"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Mail, Send } from "lucide-react";
import { toast } from "sonner";

interface LeadData {
  businessName: string;
  email?: string;
  location?: string;
  niche?: string;
  phone?: string;
  website?: string | null;
  leadTemperature?: string;
}

interface PitchData {
  subject: string;
  body: string;
}

export function QuickPitchModal({
  lead,
  open,
  onOpenChange,
}: {
  lead: LeadData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pitch, setPitch] = useState<PitchData>({ subject: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const generatePitch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads/generate-pitch-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pitch generation failed");
      setPitch({
        subject: data.pitch?.subject || "",
        body: data.pitch?.body || "",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generatePitch();
    }
  }, [open, lead]);

  const handleSendEmail = async () => {
    if (!lead.email) {
      toast.error("Lead email not found");
      return;
    }
    if (!pitch.subject || !pitch.body) {
      toast.error("Pitch not generated yet");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/leads/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: lead.email,
          subject: pitch.subject,
          body: pitch.body,
          leadName: lead.businessName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email sending failed");
      toast.success("Email sent successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Short Pitch
          </DialogTitle>
          <DialogDescription>
            Professional first-contact email for {lead.businessName}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Subject</label>
              <Input
                value={pitch.subject}
                onChange={(e) => setPitch({ ...pitch, subject: e.target.value })}
                className="bg-white/5 border-white/10 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email Body</label>
              <Textarea
                value={pitch.body}
                onChange={(e) => setPitch({ ...pitch, body: e.target.value })}
                rows={10}
                className="bg-white/5 border-white/10 text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Sending to: <span className="font-medium text-foreground">{lead.email || "No email available"}</span>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-1"
            onClick={() => {
              navigator.clipboard.writeText(`${pitch.subject}\n\n${pitch.body}`);
              toast.success("Copied to clipboard!");
            }}
          >
            <Copy className="h-4 w-4" /> Copy Pitch
          </Button>
          <Button
            className="gap-1 btn-gradient"
            onClick={handleSendEmail}
            disabled={sending || loading}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}