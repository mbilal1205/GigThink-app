"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProfessionalProposalEditor } from "@/components/proposals/ProposalEditor";
import { AISidePanel } from "@/components/proposals/panles/AISidePanel";
import { TaskBoard } from "@/components/projects/TaskBoard";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  FileText,
  ListTodo,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProposalData {
  _id: string;
  title: string;
  sections: any[];
  metadata: {
    clientName: string;
    clientCompany?: string;
    clientEmail?: string;
    totalBudget?: number;
    currency: string;
  };
  status?: string;
}

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"proposal" | "tasks">("proposal");
  const [simulatingWin, setSimulatingWin] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);

  const fetchProposal = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/proposals?projectId=${projectId}&limit=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load proposal");
      if (!data.proposals || data.proposals.length === 0)
        throw new Error("No proposal found");

      const raw = data.proposals[0];
      setProposal({
        _id: raw._id,
        title: raw.title,
        sections: raw.sections || [],
        metadata: {
          clientName: raw.clientName || "Unknown Client",
          clientCompany: raw.clientCompany || "",
          clientEmail: raw.clientEmail || "",
          totalBudget: raw.totalBudget || 0,
          currency: raw.currency || "USD",
        },
        status: raw.status || "draft",
      });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const handleSave = useCallback(
    async (sections: any[], title: string) => {
      if (!proposal?._id) throw new Error("No proposal to save");
      const res = await fetch(`/api/proposals/${proposal._id}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, title }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      return await res.json();
    },
    [proposal]
  );

  const handleAIGenerate = useCallback(
    async (sectionId: string, sectionType: string): Promise<string> => {
      if (!proposal) throw new Error("Proposal not loaded");
      const section = proposal.sections.find((s: any) => s.id === sectionId);

      const res = await fetch("/api/proposals/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate professional content for: ${section?.title || sectionType}`,
          target: sectionType,
          projectTitle: proposal.title,
          clientName: proposal.metadata.clientName,
          currentContent: section?.content || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI generation failed");
      }
      const data = await res.json();

      setProposal((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s: any) =>
            s.id === sectionId ? { ...s, content: data.content, aiGenerated: true } : s
          ),
        };
      });

      return data.content;
    },
    [proposal]
  );

  const handleSectionUpdate = useCallback((sectionId: string, content: string) => {
    setProposal((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s: any) =>
          s.id === sectionId ? { ...s, content } : s
        ),
      };
    });
  }, []);

  const handleExportPDF = useCallback(async () => {
    const res = await fetch(`/api/proposals/${proposal?._id || projectId}/pdf`);
    if (!res.ok) throw new Error("PDF generation failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Proposal_${proposal?.title || projectId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [projectId, proposal]);

  const handleSimulateWin = async () => {
    if (!proposal?._id) return;
    setSimulatingWin(true);
    try {
      const res = await fetch(`/api/proposals/${proposal._id}/simulate-win`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to simulate win");
      toast.success("ðŸŽ‰ Client won! Project is now In Progress.");
      setProposal((prev: any) => ({ ...prev, status: "accepted" }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSimulatingWin(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!projectId) return;
    setGeneratingTasks(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-tasks`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tasks");
      toast.success(`âœ… ${data.tasksCreated} tasks generated!`);
      // Trigger task board refresh if activeTab is tasks
      if (activeTab === "tasks") {
        // You can call fetchTasks from TaskBoard via key change or window event
        // Simple approach: set a state to remount TaskBoard
        // We'll use a state `taskRefreshKey` and pass it as key to TaskBoard
        // For now, let's just set activeTab to tasks to show tasks
        setActiveTab("tasks");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingTasks(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading Proposal Workspace...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Failed to Load Proposal</h3>
        <p className="text-muted-foreground">{error || "Proposal not found"}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={fetchProposal}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen bg-background">
      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300 min-w-0", isPanelOpen ? "mr-96" : "mr-0")}>
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-background/95 backdrop-blur-md px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold heading-gradient truncate max-w-[300px]">{proposal.title}</h1>
              <p className="text-xs text-muted-foreground">
                Client: {proposal.metadata.clientName} Â· Status:{" "}
                <Badge variant="outline" className="ml-1">{proposal.status || "draft"}</Badge>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {proposal.status !== "accepted" && (
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={handleSimulateWin}
                disabled={simulatingWin}
              >
                {simulatingWin ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Simulate Client Won
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleGenerateTasks}
              disabled={generatingTasks}
            >
              {generatingTasks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Tasks
            </Button>
            {/* Tab Switch */}
            <div className="flex items-center gap-1 bg-card border border-white/10 rounded-xl p-1 ml-2">
              <button
                onClick={() => setActiveTab("proposal")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === "proposal"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" /> Proposal
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === "tasks"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListTodo className="h-4 w-4" /> Tasks
              </button>
            </div>
            {/* AI Panel Toggle */}
            <Button variant={isPanelOpen ? "secondary" : "outline"} size="sm" className="gap-1.5" onClick={() => setIsPanelOpen(!isPanelOpen)}>
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">AI Panel</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "proposal" ? (
            <ProfessionalProposalEditor
              proposal={proposal}
              onSave={handleSave}
              onAIGenerate={handleAIGenerate}
              onExportPDF={handleExportPDF}
              onBack={() => router.back()}
            />
          ) : (
            <div className="max-w-5xl mx-auto">
              <TaskBoard projectId={projectId} />
            </div>
          )}
        </div>
      </div>

      {/* AI Side Panel */}
      {isPanelOpen && (
        <AISidePanel
          sections={proposal.sections}
          projectTitle={proposal.title}
          clientName={proposal.metadata.clientName}
          onSectionUpdate={handleSectionUpdate}
          className="w-96"
        />
      )}
    </div>
  );
}