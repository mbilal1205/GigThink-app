"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Share2,
  Eye,
  Save,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import OpportunityDetailModal from "../components/opportunities/OpportunityDetailModal";

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

interface AIScore {
  matchPercentage: number;
  recommendation: "apply" | "dont_apply" | "maybe";
  reasoning: string;
  hiddenPain?: string;
  clientQuality?: number;
  urgency?: "high" | "medium" | "low";
  suggestedApproach?: string;
  missingSkills?: string[];
  nextSteps?: string[];
}

export default function OpportunityCard({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [aiScore, setAiScore] = useState<AIScore | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const getScoreBadge = (score: number) => {
    if (score >= 90)
      return { color: "bg-red-500/10 text-red-400 border-red-500/30", label: "ðŸ”¥ Excellent" };
    if (score >= 75)
      return { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", label: "ðŸŸ¢ Strong" };
    return { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", label: "ðŸŸ¡ Good" };
  };

  const badge = getScoreBadge(opportunity.score);

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

  const handleGenerateProposal = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/opportunities/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          alert("Free trial limit reached. Please upgrade.");
        } else {
          alert(data.error || "Failed to generate");
        }
        return;
      }
      const data = await res.json();
      router.push(`/projects/${data.projectId}/proposal`);
    } catch (err) {
      alert("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleAIScore = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/opportunities/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          clientName: opportunity.company,
          budget: opportunity.budget_min || opportunity.budget_max || undefined,
          currency: opportunity.budget_currency || "USD",
          skillsRequired: opportunity.skills,
          source: "feed",
          postedAt: opportunity.posted_at,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      setAiScore(data.score);
      setShowAiDetail(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFullWorkflow = async () => {
    if (workflowLoading) return;
    setWorkflowLoading(true);
    toast.info("ðŸš€ Starting full workflow...");
    try {
      const res = await fetch("/api/workflow/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opportunity.title,
          description: opportunity.description,
          clientName: opportunity.company,
          budgetMin: opportunity.budget_min,
          budgetMax: opportunity.budget_max,
          currency: opportunity.budget_currency || "USD",
          skills: opportunity.skills,
          location: opportunity.location,
          sourceUrl: opportunity.source_url,
          source: "feed",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workflow failed");
      toast.success("âœ… Workflow completed! Redirecting to project...");
      if (data.projectId) {
        router.push(`/projects/${data.projectId}`);
      } else {
        router.push("/projects/list");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorkflowLoading(false);
    }
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
    // Placeholder save (could integrate with saved_leads)
    setTimeout(() => {
      setSaved(!saved);
      setSaving(false);
      toast.success(saved ? "Removed from saved" : "Opportunity saved");
    }, 500);
  };

  const recommendationConfig = aiScore
    ? {
        apply: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Apply Now" },
        maybe: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Maybe" },
        dont_apply: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Don't Apply" },
      }[aiScore.recommendation]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group rounded-xl border border-white/10 bg-card/70 backdrop-blur-sm p-5 space-y-3 transition-all hover:bg-card/80 hover:border-primary/30 hover:shadow-lg card-hover"
    >
      {/* Header Row with Avatar */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
          {opportunity.company?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {opportunity.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-2">
            {opportunity.company}
            <span className="text-muted-foreground/50">Â·</span>
            <span>{timeAgo(opportunity.posted_at)}</span>
          </p>
        </div>
        <Badge
          className={cn(
            "shrink-0 text-xs font-medium px-2.5 py-0.5 border",
            badge.color
          )}
        >
          {badge.label} {opportunity.score}%
        </Badge>
      </div>

      {/* Meta Info Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          {budgetDisplay}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary/70" />
          {opportunity.is_remote ? "Remote" : opportunity.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {timeAgo(opportunity.posted_at)}
        </span>
      </div>

      {/* Skills Tags */}
      {opportunity.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opportunity.skills.map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20 px-2 py-0"
            >
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* Why This? */}
      <div className="text-xs space-y-1.5 pt-1 border-t border-white/10">
        <p className="font-medium text-foreground/90 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Why This?
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
          {opportunity.why_this.map((reason, idx) => (
            <li key={idx}>{reason}</li>
          ))}
        </ul>
      </div>

      {/* AI Score Section */}
      <div className="border-t border-white/10 pt-2">
        {!aiScore ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
            onClick={handleAIScore}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiLoading ? "Analyzing..." : "AI Score & Match"}
          </Button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {recommendationConfig && (
                    <recommendationConfig.icon className={`h-5 w-5 ${recommendationConfig.color}`} />
                  )}
                  <span className={`font-bold ${recommendationConfig?.color}`}>
                    {recommendationConfig?.label}
                  </span>
                </div>
                <span className="text-xl font-bold">{aiScore.matchPercentage}%</span>
              </div>

              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    aiScore.matchPercentage >= 70
                      ? "bg-emerald-500"
                      : aiScore.matchPercentage >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${aiScore.matchPercentage}%` }}
                />
              </div>

              {aiScore.reasoning && (
                <p className="text-xs text-muted-foreground">{aiScore.reasoning}</p>
              )}

              {aiScore.hiddenPain && (
                <p className="text-xs italic text-blue-400">
                  ðŸŽ¯ Hidden Pain: {aiScore.hiddenPain}
                </p>
              )}

              <button
                onClick={() => setShowAiDetail(!showAiDetail)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {showAiDetail ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {showAiDetail ? "Hide Details" : "View AI Analysis"}
              </button>

              {showAiDetail && (
                <div className="space-y-2 text-xs">
                  {aiScore.suggestedApproach && (
                    <p>
                      <span className="font-semibold text-foreground">Suggested Approach:</span>{" "}
                      {aiScore.suggestedApproach}
                    </p>
                  )}
                  {aiScore.urgency && (
                    <p>
                      <span className="font-semibold text-foreground">Urgency:</span> {aiScore.urgency}
                    </p>
                  )}
                  {aiScore.clientQuality !== undefined && (
                    <p>
                      <span className="font-semibold text-foreground">Client Quality:</span>{" "}
                      {aiScore.clientQuality}/100
                    </p>
                  )}
                  {aiScore.missingSkills && aiScore.missingSkills.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground">Missing Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiScore.missingSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiScore.nextSteps && aiScore.nextSteps.length > 0 && (
                    <ul className="space-y-1">
                      {aiScore.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <TrendingUp className="h-3 w-3 mt-0.5 text-primary" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs font-medium border-white/10 bg-white/5 hover:bg-white/10 hover:text-white gap-1.5"
          onClick={() => setViewOpen(true)}
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button
          size="sm"
          className="flex-1 h-9 text-xs font-semibold btn-gradient gap-1.5"
          onClick={handleGenerateProposal}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Proposal"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-9 text-xs font-medium gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Full Workflow Button */}
      <Button
        size="sm"
        variant="outline"
        className="w-full h-9 text-xs font-semibold border-purple-500/30 text-purple-300 hover:bg-purple-500/10 gap-1.5"
        onClick={handleFullWorkflow}
        disabled={workflowLoading}
      >
        {workflowLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {workflowLoading ? "Running Full Workflow..." : "âš¡ Full Workflow (Demo)"}
      </Button>

      {/* Detail Modal */}
      <OpportunityDetailModal
        opportunity={opportunity}
        open={viewOpen}
        onOpenChange={setViewOpen}
        onGenerateProposal={handleGenerateProposal}
      />
    </motion.div>
  );
}