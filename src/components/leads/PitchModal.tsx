"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Mail } from "lucide-react";
import { toast } from "sonner";

export function PitchModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPitch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leads/${lead.id}/generate-pitch`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setPitch(data.pitch);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPitch();
  }, [lead.id]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Short Pitch</DialogTitle>
          <DialogDescription>Quick first impression email for {lead.lead_data.businessName}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={8} className="bg-white/5 border-white/10 text-sm" />
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="gap-1" onClick={() => { navigator.clipboard.writeText(pitch); toast.success("Copied to clipboard!"); }}>
            <Copy className="h-4 w-4" /> Copy Pitch
          </Button>
          <Button className="gap-1 btn-gradient" onClick={() => window.location.href = `mailto:${lead.lead_data.email}?body=${encodeURIComponent(pitch)}`}>
            <Mail className="h-4 w-4" /> Send via Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}