"use client";

import { useState } from "react";
import { ConvertToClientButton } from "@/components/leads/ConvertToClientButton";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  User2,
  Star,
  TrendingUp,
  Save,
  Sparkles,
  Loader2,
  Check,
  MoreHorizontal,
  Share2,
  MessageCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QuickPitchModal } from "./QuickPitchModal";
import LeadDetailModal from "./LeadDetailModal";

interface GlobalLeadCardProps {
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
  };
}

export default function GlobalLeadCard({ lead }: GlobalLeadCardProps) {
  const [isSaved, setIsSaved] = useState(lead.is_saved);
  const [saving, setSaving] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  const handleShare = async () => {
    const shareData = {
      title: lead.business_name,
      text: `Check out this lead: ${lead.business_name}${lead.location ? ` - ${lead.location}` : ""}`,
      url: lead.website || undefined,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Lead shared successfully");
      } catch (err) {
        // User cancelled
      }
    } else {
      const textToCopy = `${lead.business_name}\n${lead.location || ""}\n${lead.email || ""}\n${lead.phone || ""}\n${lead.website || ""}`;
      await navigator.clipboard.writeText(textToCopy);
      toast.success("Lead details copied to clipboard");
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
    <div className="group relative rounded-xl border border-white/10 bg-card/70 backdrop-blur-sm p-5 transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-lg card-hover">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
          {lead.business_name?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {lead.business_name}
            </h3>
            {lead.rating !== null && lead.rating > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                <Star className="h-3.5 w-3.5" />
                {lead.rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {lead.niche && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                {lead.niche}
              </Badge>
            )}
            {lead.lead_temperature && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
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
          </div>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Contact Info */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
        {lead.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary/70" />
            <span className="truncate">{lead.location}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-primary/70" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary/70" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary/70" />
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

      {/* Source & Time */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span>{lead.source}</span>
        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      {/* Actions */}
<div className="mt-4 flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    className={cn(
      "flex-1 gap-1",
      isSaved
        ? "border-primary/50 text-primary bg-primary/10"
        : "border-white/10 text-muted-foreground hover:text-foreground"
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
    {isSaved ? "Saved" : "Save"}
  </Button>
  <Button
    size="sm"
    variant="outline"
    className="flex-1 gap-1 border-primary/30 text-primary hover:bg-primary/10"
    onClick={() => setPitchOpen(true)}
  >
    <MessageCircle className="h-4 w-4" />
    Pitch
  </Button>
  <Button
    size="sm"
    variant="ghost"
    className="flex-1 gap-1 text-muted-foreground hover:text-foreground"
    onClick={() => setViewOpen(true)}
  >
    <Eye className="h-4 w-4" />
    View
  </Button>
  <Button
    size="icon"
    variant="ghost"
    className="shrink-0 text-muted-foreground hover:text-foreground"
    onClick={handleShare}
    title="Share"
  >
    <Share2 className="h-4 w-4" />
  </Button>

  {/* Convert to Client â€“ compact icon button */}
  <ConvertToClientButton lead={lead} compact />
</div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-14 right-4 bg-card border border-white/10 rounded-lg shadow-xl z-10 py-1 w-40">
          <button
            className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-foreground"
            onClick={() => {
              setShowMenu(false);
              toast.info("Report lead coming soon");
            }}
          >
            Report Lead
          </button>
          <button
            className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-red-400"
            onClick={() => {
              setShowMenu(false);
              toast.info("Hide lead coming soon");
            }}
          >
            Hide Lead
          </button>
        </div>
      )}

      {/* Modals */}
      {pitchOpen && (
        <QuickPitchModal
          lead={pitchLeadData}
          open={pitchOpen}
          onOpenChange={setPitchOpen}
        />
      )}
      {viewOpen && (
        <LeadDetailModal
          lead={lead}
          open={viewOpen}
          onOpenChange={setViewOpen}
        />
      )}
    </div>
  );
}