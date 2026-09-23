"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Mail,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  MapPin,
  TrendingUp,
  Eye,
  Zap,
  ChevronUp,
  ChevronDown,
  Phone,
  Globe,
  X,
  LayoutGrid,
  List,
  Info,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { QuickPitchModal } from "@/components/leads/QuickPitchModal";
import { ConfirmActionDialog } from "@/components/ui/confirm-delete-dialog";

interface SavedLead {
  id: string;
  lead_data: {
    businessName: string;
    email?: string;
    phone?: string;
    website?: string | null;
    location?: string;
    rating?: number;
    leadTemperature?: string;
    niche?: string;
  };
  status: string;
  ai_score: any;
  notes?: string;
  created_at: string;
}

// â”€â”€â”€ FRAMER MOTION VARIANTS FOR SMOOTH STAGGERED ENTRANCE â”€â”€â”€
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export default function SavedLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "feed">("list");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [pitchLead, setPitchLead] = useState<SavedLead | null>(null);
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [analysisLead, setAnalysisLead] = useState<SavedLead | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?status=${activeStatus}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch leads");
      setLeads(data.leads || []);
      setCurrentIndex(0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleAnalyze = async (lead: SavedLead) => {
    setAnalyzingId(lead.id);
    try {
      const res = await fetch(`/api/leads/${lead.id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      toast.success("AI analysis completed!");
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleOpenAnalysis = (lead: SavedLead) => {
    setAnalysisLead(lead);
    setAnalysisModalOpen(true);
  };

  const handleGenerateProposal = async (lead: SavedLead) => {
    setGeneratingId(lead.id);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate-proposal`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proposal generation failed");
      toast.success("Proposal generated!");
      if (data.projectId) {
        router.push(`/projects/${data.projectId}/proposal`);
      } else {
        router.push("/projects/list");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGeneratePitch = (lead: SavedLead) => {
    setPitchLead(lead);
    setPitchModalOpen(true);
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Status updated");
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/leads/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Lead deleted");
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!feedRef.current) return;
    const container = feedRef.current;
    const cards = container.children;
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleScroll = () => {
    if (!feedRef.current) return;
    const container = feedRef.current;
    const scrollTop = container.scrollTop;
    const cardHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / cardHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < leads.length) {
      setCurrentIndex(newIndex);
    }
  };

  const statuses = ["all", "saved", "contacted", "proposal_sent", "converted"];

  return (
    <div className="relative w-full min-h-screen space-y-8 p-4 md:p-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* â”€â”€â”€ HEADER â”€â”€â”€ */}
      <div className="relative z-10 flex flex-col gap-2">
        <h2 className="text-3xl md:text-4xl font-bold heading-gradient tracking-tight">
          My Leads Pipeline
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
          Manage your outreach, track conversions, and let AI optimize your next
          move.
        </p>
      </div>

      {/* â”€â”€â”€ TOP CONTROLS â”€â”€â”€ */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs
          value={activeStatus}
          onValueChange={setActiveStatus}
          className="w-full max-w-2xl"
        >
          <TabsList className="glass border-border/50 rounded-xl p-1 gap-1 w-full overflow-x-auto">
            {statuses.map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                className="flex-1 min-w-[80px] rounded-lg text-xs md:text-sm capitalize transition-all duration-200 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {s.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex glass rounded-lg p-1 border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 rounded-md transition-all",
              viewMode === "list"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" /> List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 rounded-md transition-all",
              viewMode === "feed"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setViewMode("feed")}
          >
            <LayoutGrid className="h-4 w-4" /> Feed
          </Button>
        </div>
      </div>

      {/* â”€â”€â”€ CONTENT AREA â”€â”€â”€ */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm animate-pulse">
              Syncing your pipeline...
            </p>
          </div>
        ) : leads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl text-center py-20 px-6 border-dashed"
          >
            <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-muted-foreground opacity-60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No leads in this stage
            </h3>
            <p className="text-muted-foreground text-sm">
              Start adding leads to see them appear here.
            </p>
          </motion.div>
        ) : viewMode === "list" ? (
          // â”€â”€â”€ LIST VIEW â”€â”€â”€
          <motion.div
            className="grid grid-cols-1 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {leads.map((lead) => (
                <motion.div key={lead.id} layout exit="exit">
                  <Card className="glass card-hover rounded-xl border-border/50 overflow-hidden group">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg md:text-xl font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {lead.lead_data.businessName}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 text-xs font-medium px-2.5 py-0.5",
                                lead.status === "converted"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : lead.status === "contacted"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "bg-muted text-muted-foreground border-border",
                              )}
                            >
                              {lead.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-muted-foreground">
                            {lead.lead_data.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary/70" />{" "}
                                {lead.lead_data.location}
                              </span>
                            )}
                            {lead.lead_data.email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-primary/70" />{" "}
                                {lead.lead_data.email}
                              </span>
                            )}
                            {lead.lead_data.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-primary/70" />{" "}
                                {lead.lead_data.phone}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {lead.lead_data.leadTemperature && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-semibold uppercase tracking-wider",
                                  lead.lead_data.leadTemperature === "Hot"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                )}
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {lead.lead_data.leadTemperature}
                              </Badge>
                            )}
                            {lead.lead_data.niche && (
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                                {lead.lead_data.niche}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: AI Score & Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-56 shrink-0">
                          {lead.ai_score && (
                            <div className="flex items-center lg:items-start gap-3 lg:flex-col lg:gap-1 mb-2 lg:mb-4">
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold heading-gradient">
                                  {lead.ai_score.matchPercentage}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Match
                                </span>
                              </div>
                              <Badge
                                className={cn(
                                  "text-[10px] font-medium",
                                  lead.ai_score.recommendation === "apply"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                    : lead.ai_score.recommendation === "maybe"
                                      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                      : "bg-red-500/15 text-red-400 border-red-500/20",
                                )}
                              >
                                {lead.ai_score.recommendation === "apply"
                                  ? "Apply Now"
                                  : lead.ai_score.recommendation === "maybe"
                                    ? "Maybe"
                                    : "Skip"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                                onClick={() => handleOpenAnalysis(lead)}
                              >
                                <Info className="h-3.5 w-3.5 mr-1" /> Details
                              </Button>
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all"
                              onClick={() => handleAnalyze(lead)}
                              disabled={analyzingId === lead.id}
                            >
                              {analyzingId === lead.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              AI Analyze
                            </Button>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-2 border-border/50 hover:bg-accent transition-all"
                                onClick={() => handleGeneratePitch(lead)}
                              >
                                <Mail className="h-3.5 w-3.5" /> Pitch
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 gap-2 btn-gradient text-primary-foreground font-medium"
                                onClick={() => handleGenerateProposal(lead)}
                                disabled={generatingId === lead.id}
                              >
                                {generatingId === lead.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Zap className="h-3.5 w-3.5" />
                                )}
                                Proposal
                              </Button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  handleStatusChange(lead.id, "contacted")
                                }
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />{" "}
                                Mark Contacted
                              </Button>
                              <Button
                               variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => setDeleteTarget(lead)}>
                                <Trash2 className="h-4 w-4" /> 
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          // â”€â”€â”€ TIKTOK-STYLE FEED VIEW â”€â”€â”€
          <div className="relative h-[calc(100vh-14rem)] max-w-2xl mx-auto flex flex-col">
            {/* Scroll Fade Overlays */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

            <div
              ref={feedRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto snap-y snap-mandatory rounded-2xl scrollbar-hide"
              style={{ height: "100%" }}
            >
              {leads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: currentIndex === index ? 1 : 0.5,
                    scale: currentIndex === index ? 1.02 : 0.95,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="snap-start h-full flex items-center p-2"
                  style={{ minHeight: "100%" }}
                >
                  <Card
                    className={cn(
                      "w-full border backdrop-blur-xl overflow-hidden transition-all duration-300",
                      currentIndex === index
                        ? "glass brand-glow border-primary/20"
                        : "bg-card/40 border-border/30",
                    )}
                  >
                    <CardContent className="p-6 md:p-8 h-full flex flex-col">
                      <div className="flex-1 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-bold heading-gradient mb-1">
                              {lead.lead_data.businessName}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5" />{" "}
                              {lead.lead_data.niche || "General Business"}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium px-3 py-1",
                              lead.status === "converted"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {lead.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {lead.lead_data.location && (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                              <MapPin className="h-4 w-4 text-primary" />{" "}
                              {lead.lead_data.location}
                            </div>
                          )}
                          {lead.lead_data.email && (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                              <Mail className="h-4 w-4 text-primary" />{" "}
                              {lead.lead_data.email}
                            </div>
                          )}
                          {lead.lead_data.phone && (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                              <Phone className="h-4 w-4 text-primary" />{" "}
                              {lead.lead_data.phone}
                            </div>
                          )}
                          {lead.lead_data.website && (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                              <Globe className="h-4 w-4 text-primary" />
                              <a
                                href={lead.lead_data.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors truncate"
                              >
                                {lead.lead_data.website
                                  .replace(/^https?:\/\//, "")
                                  .replace("www.", "")}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {lead.lead_data.leadTemperature && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                lead.lead_data.leadTemperature === "Hot"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              )}
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />{" "}
                              {lead.lead_data.leadTemperature}
                            </Badge>
                          )}
                          {lead.lead_data.rating && (
                            <span className="text-sm font-medium text-foreground flex items-center gap-1">
                              â­ {lead.lead_data.rating}
                            </span>
                          )}
                        </div>

                        {lead.ai_score && (
                          <div className="glass rounded-xl p-4 border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="text-center sm:text-left">
                                <p className="text-3xl font-bold heading-gradient">
                                  {lead.ai_score.matchPercentage}%
                                </p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                  AI Match
                                </p>
                              </div>
                              <div className="h-8 w-px bg-border/50 hidden sm:block" />
                              <Badge
                                className={cn(
                                  "text-sm px-3 py-1",
                                  lead.ai_score.recommendation === "apply"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                    : lead.ai_score.recommendation === "maybe"
                                      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                      : "bg-red-500/15 text-red-400 border-red-500/20",
                                )}
                              >
                                {lead.ai_score.recommendation === "apply"
                                  ? "Apply Now"
                                  : lead.ai_score.recommendation === "maybe"
                                    ? "Maybe"
                                    : "Don't Apply"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-primary hover:bg-primary/10 shrink-0"
                              onClick={() => handleOpenAnalysis(lead)}
                            >
                              <Info className="h-4 w-4" /> View Full Analysis
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 mt-4 border-t border-border/50 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-primary/20 text-primary hover:bg-primary/10 h-11"
                            onClick={() => handleAnalyze(lead)}
                            disabled={analyzingId === lead.id}
                          >
                            {analyzingId === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}{" "}
                            AI Analyze
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-border/50 hover:bg-accent h-11"
                            onClick={() => handleGeneratePitch(lead)}
                          >
                            <Mail className="h-4 w-4" /> Short Pitch
                          </Button>
                          <Button
                            size="sm"
                            className="gap-2 btn-gradient text-primary-foreground font-medium h-11"
                            onClick={() => handleGenerateProposal(lead)}
                            disabled={generatingId === lead.id}
                          >
                            {generatingId === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}{" "}
                            Full Proposal
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleStatusChange(lead.id, "contacted")
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" /> Mark Contacted
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(lead)}
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {leads.length > 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 pr-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full glass border-border/50 transition-all",
                    currentIndex === 0
                      ? "opacity-30 pointer-events-none"
                      : "hover:border-primary/40 hover:text-primary",
                  )}
                  onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full glass border-border/50 transition-all",
                    currentIndex === leads.length - 1
                      ? "opacity-30 pointer-events-none"
                      : "hover:border-primary/40 hover:text-primary",
                  )}
                  onClick={() =>
                    scrollToIndex(Math.min(leads.length - 1, currentIndex + 1))
                  }
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* â”€â”€â”€ MODALS â”€â”€â”€ */}
      {pitchLead && (
        <QuickPitchModal
          lead={pitchLead.lead_data}
          open={pitchModalOpen}
          onOpenChange={setPitchModalOpen}
        />
      )}

      {analysisLead?.ai_score && (
        <Dialog open={analysisModalOpen} onOpenChange={setAnalysisModalOpen}>
          <DialogContent className="glass border-border/50 text-foreground max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="heading-gradient">AI Analysis</span>
                <span className="text-muted-foreground font-normal text-base">
                  for {analysisLead.lead_data.businessName}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pt-1">
                Comprehensive AI-powered lead evaluation and strategic
                recommendations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Score Header */}
              <div className="glass rounded-xl p-5 border-border/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold heading-gradient">
                      {analysisLead.ai_score.matchPercentage}%
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      Match Score
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border/50 hidden sm:block" />
                  <div className="space-y-1">
                    <Badge
                      className={cn(
                        "text-sm px-3 py-1",
                        analysisLead.ai_score.recommendation === "apply"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : analysisLead.ai_score.recommendation === "maybe"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                            : "bg-red-500/15 text-red-400 border-red-500/20",
                      )}
                    >
                      {analysisLead.ai_score.recommendation === "apply"
                        ? "Apply Now"
                        : analysisLead.ai_score.recommendation === "maybe"
                          ? "Maybe"
                          : "Don't Apply"}
                    </Badge>
                    {analysisLead.ai_score.urgency && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {analysisLead.ai_score.urgency} Urgency
                      </p>
                    )}
                  </div>
                </div>
                {analysisLead.ai_score.clientQuality !== undefined && (
                  <div className="text-center bg-muted/30 px-4 py-2 rounded-lg border border-border/30">
                    <p className="text-xl font-bold text-foreground">
                      {analysisLead.ai_score.clientQuality}
                      <span className="text-sm text-muted-foreground font-normal">
                        /100
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Client Quality
                    </p>
                  </div>
                )}
              </div>

              <div className="divider h-px w-full" />

              {/* Details Grid */}
              <div className="grid gap-5">
                {analysisLead.ai_score.reasoning && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" /> Reasoning
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30">
                      {analysisLead.ai_score.reasoning}
                    </p>
                  </div>
                )}

                {analysisLead.ai_score.hiddenPain && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />{" "}
                      Hidden Pain Point
                    </h4>
                    <p className="text-sm text-blue-300 leading-relaxed bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                      {analysisLead.ai_score.hiddenPain}
                    </p>
                  </div>
                )}

                {analysisLead.ai_score.suggestedApproach && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Suggested
                      Approach
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysisLead.ai_score.suggestedApproach}
                    </p>
                  </div>
                )}

                {analysisLead.ai_score.missingSkills &&
                  analysisLead.ai_score.missingSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Missing Skills / Gaps
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisLead.ai_score.missingSkills.map(
                          (skill: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-destructive/5 text-destructive border-destructive/20"
                            >
                              {skill}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {analysisLead.ai_score.nextSteps &&
                  analysisLead.ai_score.nextSteps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />{" "}
                        Recommended Next Steps
                      </h4>
                      <ul className="space-y-2">
                        {analysisLead.ai_score.nextSteps.map(
                          (step: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-3 bg-muted/20 p-3 rounded-lg border border-border/30"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ConfirmActionDialog
  open={!!deleteTarget}
  onClose={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Delete Lead?"
  description={`Are you sure you want to delete this lead? This action cannot be undone.`}
/>
    </div>
  );
}
