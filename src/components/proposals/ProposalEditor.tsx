"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  GripVertical,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Download,
  ArrowLeft,
  Loader2,
  FileText,
  MoreVertical,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface SectionData {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  isCustom: boolean;
  isVisible: boolean;
  aiGenerated: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProposalMetadata {
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  totalBudget?: number;
  currency: string;
}

interface ProposalData {
  _id: string;
  title: string;
  sections: SectionData[];
  metadata: ProposalMetadata;
  status?: string;
}

interface ProfessionalProposalEditorProps {
  proposal: ProposalData;
  onSave: (sections: SectionData[], title: string) => Promise<any>;
  onAIGenerate: (sectionId: string, sectionType: string) => Promise<string>;
  onExportPDF?: () => Promise<void>;
  onBack: () => void;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const SECTION_ICONS: Record<string, string> = {
  "cover-letter": "📋",
  "executive-summary": "📊",
  "problem-statement": "⚠️",
  "proposed-solution": "💡",
  "technical-architecture": "🏗️",
  "project-timeline": "📅",
  "investment-pricing": "💰",
  "terms-conditions": "📜",
  custom: "📝",
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

export function ProfessionalProposalEditor({
  proposal: initialProposal,
  onSave,
  onAIGenerate,
  onExportPDF,
  onBack,
}: ProfessionalProposalEditorProps) {
  // ── State ──
  const [proposalTitle, setProposalTitle] = useState(initialProposal.title);
  const [sections, setSections] = useState<SectionData[]>(
    [...initialProposal.sections].sort((a, b) => a.order - b.order)
  );
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showHiddenSections, setShowHiddenSections] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ── Computed ──
  const visibleSections = sections.filter((s) => s.isVisible);
  const hiddenSections = sections.filter((s) => !s.isVisible);

  // ── Handlers ──

  // Drag & Drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setSections(updatedItems);
    toast.success("Section reordered! Save to persist changes.");
  }, [sections]);

  // Update section content
  const updateSectionContent = useCallback((sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId 
          ? { ...s, content, aiGenerated: s.aiGenerated, updatedAt: new Date() } 
          : s
      )
    );
  }, []);

  // Update section title
  const updateSectionTitle = useCallback((sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, title } : s
      )
    );
  }, []);

  // Toggle visibility
  const toggleVisibility = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
      )
    );
  }, []);

  // Toggle expand/collapse
  const toggleExpand = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Delete section
  const deleteSection = useCallback((sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    
    if (section && !section.isCustom) {
      toast.error("Default sections cannot be deleted. You can hide them instead.", {
        description: "Click the eye icon to hide this section.",
      });
      return;
    }

    setSections((prev) =>
      prev
        .filter((s) => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
    toast.success("Section deleted successfully!");
  }, [sections]);

  // Duplicate section
  const duplicateSection = useCallback((sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newSection: SectionData = {
      ...section,
      id: `copy-${Date.now()}`,
      title: `${section.title} (Copy)`,
      order: sections.length + 1,
      isCustom: true,
      aiGenerated: false,
    };

    setSections((prev) => [...prev, newSection]);
    toast.success("Section duplicated!");
  }, [sections]);

  // Add custom section
  const addCustomSection = useCallback(() => {
    const newSection: SectionData = {
      id: `custom-${Date.now()}`,
      type: "custom",
      title: "New Custom Section",
      content: "Add your custom content here...",
      order: sections.length + 1,
      isCustom: true,
      isVisible: true,
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSections((prev) => [...prev, newSection]);
    setExpandedSections((prev) => new Set(prev).add(newSection.id));
    toast.success("New section added! Scroll down to edit.");
  }, [sections.length]);

  // AI Generate
  const handleAIGenerate = useCallback(async (sectionId: string, sectionType: string) => {
    setGeneratingSections((prev) => new Set(prev).add(sectionId));
    toast.info("AI is generating content...");

    try {
      const content = await onAIGenerate(sectionId, sectionType);
      
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId 
            ? { ...s, content, aiGenerated: true, updatedAt: new Date() } 
            : s
        )
      );
      
      toast.success("✨ AI content generated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "AI generation failed. Please try again.");
    } finally {
      setGeneratingSections((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
  }, [onAIGenerate]);

  // Generate ALL sections with AI
  const handleGenerateAll = useCallback(async () => {
    toast.info("Generating all sections with AI... This may take a moment.");
    
    for (const section of sections.filter(s => s.isVisible)) {
      if (!section.content || section.content.trim() === "" || section.isCustom) {
        await handleAIGenerate(section.id, section.type);
      }
    }
    
    toast.success("All sections generated!");
  }, [sections, handleAIGenerate]);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(sections, proposalTitle);
      setLastSaved(new Date());
      toast.success("✅ Proposal saved successfully!", {
        description: `All ${sections.length} sections saved.`,
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to save proposal");
    } finally {
      setSaving(false);
    }
  }, [sections, proposalTitle, onSave]);

  // Export PDF
  const handleExport = useCallback(async () => {
    if (!onExportPDF) return;
    
    setExporting(true);
    toast.info("Generating PDF...");
    
    try {
      // Save first
      await onSave(sections, proposalTitle);
      // Then export
      await onExportPDF();
      toast.success("📄 PDF downloaded successfully!");
    } catch (error: any) {
      toast.error(error?.message || "PDF export failed");
    } finally {
      setExporting(false);
    }
  }, [sections, proposalTitle, onSave, onExportPDF]);

  // Keyboard shortcut for save (Ctrl+S)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  // ── Render ──
  return (
    <TooltipProvider>
      <div 
        className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6"
        onKeyDown={handleKeyDown}
      >
        {/* ═══════ HEADER ═══════ */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left Side */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to proposals</TooltipContent>
              </Tooltip>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <Input
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="text-xl sm:text-2xl font-bold border-none p-0 h-auto bg-transparent"
                    placeholder="Enter proposal title..."
                  />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">
                    For: <span className="font-medium text-foreground">{initialProposal.metadata.clientName}</span>
                  </p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground">
                    {visibleSections.length} sections visible
                    {hiddenSections.length > 0 && ` (${hiddenSections.length} hidden)`}
                  </p>
                  {lastSaved && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        Last saved: {lastSaved.toLocaleTimeString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAll}
                    disabled={generatingSections.size > 0}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Generate All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Generate all sections with AI</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomSection}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Section</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add custom section</TooltipContent>
              </Tooltip>

              {onExportPDF && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline ml-2">PDF</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export as PDF</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {saving ? "Saving..." : "Save"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save proposal (Ctrl+S)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* ═══════ SECTIONS LIST ═══════ */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="proposal-sections">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 ${
                  snapshot.isDraggingOver ? "bg-primary/5 rounded-xl p-2" : ""
                }`}
              >
                {visibleSections.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No visible sections</p>
                    <p className="text-sm">Add a section or show hidden ones below</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCustomSection}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Section
                    </Button>
                  </div>
                )}

                {visibleSections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging
                            ? "shadow-2xl ring-2 ring-primary scale-[1.02] rotate-1"
                            : "shadow-sm hover:shadow-md"
                        }`}
                      >
                        {/* Section Header */}
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1 transition-colors"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            {/* Section Icon & Title */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg flex-shrink-0">
                                {SECTION_ICONS[section.type] || "📝"}
                              </span>
                              <Input
                                value={section.title}
                                onChange={(e) =>
                                  updateSectionTitle(section.id, e.target.value)
                                }
                                className="font-semibold text-base border-none p-0 h-auto bg-transparent flex-1 min-w-0"
                              />
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {section.aiGenerated && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Sparkles className="h-3 w-3" /> AI
                                </Badge>
                              )}
                              {section.isCustom && (
                                <Badge variant="outline" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* AI Generate Button */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      handleAIGenerate(section.id, section.type)
                                    }
                                    disabled={generatingSections.has(section.id)}
                                  >
                                    {generatingSections.has(section.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4 text-amber-500" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Generate with AI</TooltipContent>
                              </Tooltip>

                              {/* More Options Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => toggleVisibility(section.id)}>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide Section
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateSection(section.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {section.isCustom && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => deleteSection(section.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Section
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Section Content */}
                        <CardContent>
                          <Textarea
                            value={section.content}
                            onChange={(e) =>
                              updateSectionContent(section.id, e.target.value)
                            }
                            className="min-h-[120px] resize-y bg-muted/30 border-muted focus:bg-background transition-colors"
                            placeholder="Write your content here... Or click the AI button to generate automatically."
                          />
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* ═══════ HIDDEN SECTIONS ═══════ */}
        {hiddenSections.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHiddenSections(!showHiddenSections)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              {showHiddenSections ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Hidden Sections ({hiddenSections.length})
            </button>

            {showHiddenSections && (
              <div className="space-y-2">
                {hiddenSections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed"
                  >
                    <div className="flex items-center gap-3">
                      <span>{SECTION_ICONS[section.type] || "📝"}</span>
                      <span className="text-sm font-medium">
                        {section.title}
                      </span>
                      {section.aiGenerated && (
                        <Badge variant="secondary" className="text-xs">
                          AI
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(section.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Show
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ BOTTOM ACTIONS ═══════ */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Drag sections to reorder • Click AI button to generate content • Ctrl+S to save
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addCustomSection}>
              <Plus className="h-4 w-4 mr-2" /> Add Section
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}