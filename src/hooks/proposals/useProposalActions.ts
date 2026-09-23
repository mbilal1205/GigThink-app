import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  ProposalContent, 
  InsertTarget, 
  CustomBlock 
} from "@/components/proposals/proposal-types";

export function useProposalActions(
  proposal: ProposalContent | null,
  projectId: string,
  updateContent: <K extends keyof ProposalContent>(field: K, value: ProposalContent[K]) => void
) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCustomBlockId, setSelectedCustomBlockId] = useState<string | null>(null);

  // Save Proposal
  const handleSave = async () => {
    if (!proposal || !projectId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: proposal }),
      });
      if (!res.ok) throw new Error("Failed to save changes.");
      toast.success("Proposal saved successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // Copy to Clipboard
  const handleCopyText = () => {
    if (!proposal) return;
    navigator.clipboard.writeText(JSON.stringify(proposal, null, 2));
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (isDownloading || !projectId) return;
    setIsDownloading(true);
    toast.info("Generating PDF...");
    try {
      const response = await fetch(`/api/proposals/${projectId}/pdf`, { method: "GET" });
      if (!response.ok) throw new Error("PDF generation failed.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Proposal_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Could not export PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // AI Section Generator
  const handleGenerateSectionAI = useCallback(
    async (targetField: InsertTarget, customBlockId?: string) => {
      if (!proposal || !projectId) return;
      setIsGenerating(true);

      try {
        const response = await fetch(`/api/proposals/ai-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Generate professional content for ${targetField}`,
            target: targetField,
            projectTitle: proposal.projectTitle,
            clientName: proposal.clientName,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "AI generation failed.");

        if (targetField === "executiveSummary") {
          updateContent("executiveSummary", data.content);
        } else if (targetField === "problemStatement") {
          updateContent("problemStatement", data.content);
        } else if (targetField === "solutionOverview") {
          updateContent("solutionOverview", data.content);
        } else if (targetField === "customSection") {
          const blockId = customBlockId || selectedCustomBlockId;
          if (blockId && proposal.customSections) {
            const updated = proposal.customSections.map((b) =>
              b.id === blockId ? { ...b, content: data.content } : b
            );
            updateContent("customSections", updated);
          }
        }

        toast.success("AI generated content successfully!");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "AI generation error.");
      } finally {
        setIsGenerating(false);
      }
    },
    [proposal, projectId, selectedCustomBlockId, updateContent]
  );

  // Custom Blocks Management
  const handleAddCustomBlock = () => {
    if (!proposal) return;
    const newBlock: CustomBlock = {
      id: `custom-${Date.now()}`,
      title: "New Custom Section",
      content: "Enter your custom details here...",
    };
    updateContent("customSections", [...(proposal.customSections || []), newBlock]);
    setSelectedCustomBlockId(newBlock.id);
    toast.success("Custom block added.");
  };

  const handleRemoveCustomBlock = (id: string) => {
    if (!proposal || !proposal.customSections) return;
    const filtered = proposal.customSections.filter((b) => b.id !== id);
    updateContent("customSections", filtered);
    if (selectedCustomBlockId === id) {
      setSelectedCustomBlockId(filtered[0]?.id || null);
    }
    toast.success("Custom block removed.");
  };

  const updateCustomBlock = (id: string, field: "title" | "content", value: string) => {
    if (!proposal || !proposal.customSections) return;
    const updated = proposal.customSections.map((block) =>
      block.id === id ? { ...block, [field]: value } : block
    );
    updateContent("customSections", updated);
  };

  return {
    saving,
    copied,
    isDownloading,
    isGenerating,
    selectedCustomBlockId,
    handleSave,
    handleCopyText,
    handleExportPDF,
    handleGenerateSectionAI,
    handleAddCustomBlock,
    handleRemoveCustomBlock,
    updateCustomBlock,
    setSelectedCustomBlockId,
  };
}