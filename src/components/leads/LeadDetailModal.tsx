"use client";

import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Star,
  TrendingUp,
  Save,
  Sparkles,
  Zap,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QuickPitchModal } from "./QuickPitchModal";
import { useState } from "react";

interface LeadDetailModalProps {
  lead: {
    id: string;
    business_name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    location: string | null;
    niche: string | null;
    lead_temperature: string | null;
    rating: number | null;
    source: string;
    created_at: string;
    is_saved: boolean;
    raw_data?: any;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailModal({
  lead,
  open,
  onOpenChange,
}: LeadDetailModalProps) {
  const [isSaved, setIsSaved] = useState(lead?.is_saved || false);
  const [saving, setSaving] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);

  if (!lead) return null;

  const toggleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/leads/toggle-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle save");
      setIsSaved(data.is_saved);
      toast.success(data.is_saved ? "Lead saved" : "Lead removed from saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pitchLeadData = {
    businessName: lead.business_name,
    email: lead.email || "",
    phone: lead.phone || "",
    website: lead.website || null,
    location: lead.location || "",
    niche: lead.niche || "",
    leadTemperature: lead.lead_temperature || "Warm",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                  {lead.business_name?.charAt(0) || "?"}
                </span>
                {lead.business_name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{lead.source}</span>
                <span className="text-xs text-muted-foreground">Â·</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {lead.niche && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {lead.niche}
            </Badge>
          )}
          {lead.lead_temperature && (
            <Badge
              variant="outline"
              className={cn(
                lead.lead_temperature === "Hot"
                  ? "bg-red-500/10 text-red-300 border-red-500/30"
                  : lead.lead_temperature === "Warm"
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-blue-500/10 text-blue-300 border-blue-500/30"
              )}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {lead.lead_temperature}
            </Badge>
          )}
          {lead.rating !== null && lead.rating > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
              <Star className="h-3 w-3 mr-1" />
              {lead.rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Contact Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {lead.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/70" />
              <span>{lead.location}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary/70" />
              <a href={`mailto:${lead.email}`} className="hover:text-primary truncate">
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary/70" />
              <a href={`tel:${lead.phone}`} className="hover:text-primary">
                {lead.phone}
              </a>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary/70" />
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary truncate"
              >
                {lead.website.replace(/^https?:\/\//, "").replace("www.", "")}
              </a>
            </div>
          )}
        </div>

        {/* Raw Data Preview (if any) */}
        {lead.raw_data && Object.keys(lead.raw_data).length > 0 && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Additional Data</h4>
            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(lead.raw_data, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions Footer */}
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className={cn(
              "flex-1 gap-1",
              isSaved
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-white/10 text-muted-foreground"
            )}
            onClick={toggleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaved ? "Saved" : "Save Lead"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setPitchOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            Generate Pitch
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            onClick={() => toast.info("Proposal generation coming soon")}
          >
            <Zap className="h-4 w-4" />
            Proposal
          </Button>
        </DialogFooter>
      </DialogContent>

      {pitchOpen && (
        <QuickPitchModal
          lead={pitchLeadData}
          open={pitchOpen}
          onOpenChange={setPitchOpen}
        />
      )}
    </Dialog>
  );
}