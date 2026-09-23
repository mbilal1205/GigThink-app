"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ConvertToClientButtonProps {
  lead: any;
  compact?: boolean;
}

export function ConvertToClientButton({ lead, compact = false }: ConvertToClientButtonProps) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any>(lead.client || null);

  const handleConvert = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert-to-client`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      toast.success("Lead converted to client!");
      setClient(data.client);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (client) {
    return (
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className="gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        title="View Client"
        asChild
      >
        <Link href={`/clients/${client.id}`}>
          <ExternalLink className="h-4 w-4" />
          {!compact && "View Client"}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      size={compact ? "icon" : "sm"}
      onClick={handleConvert}
      disabled={loading}
      className="gap-1 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
      title="Convert to Client"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {!compact && "Convert"}
    </Button>
  );
}