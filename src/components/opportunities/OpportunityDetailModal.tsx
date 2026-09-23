"use client";

import { useState } from "react";
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ExternalLink,
  Sparkles,
  Loader2,
  Check,
  Save,
  Share2,
  ChevronDown,
  ChevronUp,
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

interface Opportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  location: string;
  is_remote: boolean;
  job_type: string;
  skills: string[];
  posted_at: string;
  source_url: string;
  score: number;
  why_this: string[];
  client_quality: string;
  competition_estimate: string;
}

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateProposal: (opportunity: Opportunity) => void;
}

// HTML tags remove + entities decode + extra spaces cleanup
const cleanDescription = (html: string): string => {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function OpportunityDetailModal({
  opportunity,
  open,
  onOpenChange,
  onGenerateProposal,
}: OpportunityDetailModalProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!opportunity) return null;

  const budgetDisplay =
    opportunity.budget_min && opportunity.budget_max
      ? `$${opportunity.budget_min} - $${opportunity.budget_max}`
      : "Budget not specified";

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleShare = async () => {
    const shareData = {
      title: opportunity.title,
      text: `${opportunity.title} at ${opportunity.company}`,
      url: opportunity.source_url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Opportunity shared");
      } catch {}
    } else {
      await navigator.clipboard.writeText(opportunity.source_url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Placeholder save â€” later API integration
    setTimeout(() => {
      setSaved(!saved);
      setSaving(false);
      toast.success(saved ? "Removed from saved" : "Opportunity saved");
    }, 500);
  };

  const cleanedDescription = cleanDescription(opportunity.description);
  const shortDescription =
    cleanedDescription.length > 200
      ? cleanedDescription.slice(0, 200) + "..."
      : cleanedDescription;
  const displayDescription = expanded ? cleanedDescription : shortDescription;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-white/10 text-foreground w-full max-w-xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-6">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                  {opportunity.company?.charAt(0) || "?"}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold leading-snug break-words">
                    {opportunity.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>{opportunity.company}</span>
                    <span>Â·</span>
                    <span>{timeAgo(opportunity.posted_at)}</span>
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => onOpenChange(false)}
              >
                âœ•
              </Button>
            </div>
          </DialogHeader>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {opportunity.score}% Match
            </Badge>
            {opportunity.client_quality && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                {opportunity.client_quality} Client
              </Badge>
            )}
            {opportunity.competition_estimate && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                {opportunity.competition_estimate} Competition
              </Badge>
            )}
            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs">
              {opportunity.job_type}
            </Badge>
          </div>

          {/* Meta Info Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="break-words">{budgetDisplay}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
              <span className="break-words">
                {opportunity.is_remote ? "Remote" : opportunity.location}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary/70 shrink-0" />
              <span className="break-words">{opportunity.job_type}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="break-words">{timeAgo(opportunity.posted_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
              {displayDescription}
            </p>
            {cleanedDescription.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> See More
                  </>
                )}
              </button>
            )}
          </div>

          {/* Skills */}
          {opportunity.skills.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="bg-white/5 text-foreground border-white/10 text-xs break-words"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Why This? */}
          {opportunity.why_this.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Why This Opportunity?</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {opportunity.why_this.map((reason, idx) => (
                  <li key={idx} className="break-words">{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t border-white/10 p-4 sm:p-5 bg-card/80 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              variant="outline"
              className={cn(
                "flex-1 min-w-[120px] gap-1 h-10 text-xs",
                saved
                  ? "border-primary/50 text-primary bg-primary/10"
                  : "border-white/10 text-muted-foreground hover:text-foreground"
              )}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? "Saved" : "Save"}
            </Button>

            <Button
              variant="outline"
              className="flex-1 min-w-[120px] gap-1 h-10 text-xs border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => onGenerateProposal(opportunity)}
            >
              <Sparkles className="h-4 w-4" />
              Proposal
            </Button>

            <Button
              variant="outline"
              className="flex-1 min-w-[120px] gap-1 h-10 text-xs"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button
              variant="outline"
              className="flex-1 min-w-[120px] gap-1 h-10 text-xs"
              asChild
            >
              <a
                href={opportunity.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Source
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}