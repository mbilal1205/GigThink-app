"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  client_name: string;
  company_name?: string;
}

export function AssignSequenceModal({
  open,
  onClose,
  sequences,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  sequences: any[];
  onAssigned: () => void;
}) {
  const [selectedSequenceId, setSelectedSequenceId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch("/api/Clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      } else {
        toast.error("Failed to load clients");
      }
    } catch (err) {
      toast.error("Error loading clients");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedSequenceId) {
      toast.error("Please select a sequence");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/follow-ups/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence_id: selectedSequenceId,
          client_id: selectedClientId || null,
          // proposal_id can be added if needed from context
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign");
      }
      toast.success("Follow-up assigned successfully");
      onAssigned();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-card/95 backdrop-blur-md text-foreground">
        <DialogHeader>
          <DialogTitle>Assign Follow-up Sequence</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose a sequence and associate it with a client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Sequence</label>
            <Select value={selectedSequenceId} onValueChange={setSelectedSequenceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sequence" />
              </SelectTrigger>
              <SelectContent>
                {sequences.map((seq) => (
                  <SelectItem key={seq.id} value={seq.id}>
                    {seq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Client (optional)</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.client_name}{" "}
                    {client.company_name ? `(${client.company_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="text-xs">
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={saving || loadingClients} className="btn-gradient text-xs">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}