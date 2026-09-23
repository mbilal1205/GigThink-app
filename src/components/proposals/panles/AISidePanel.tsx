"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Trash2,
  FileText,
  Send,
  Zap,
  PanelRight,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  content: string;
  type?: string;
}

interface AISidePanelProps {
  sections: Section[];
  projectTitle: string;
  clientName: string;
  onSectionUpdate: (sectionId: string, content: string) => void;
  className?: string;
}

// Enhanced quick prompts with icons
const QUICK_PROMPTS = [
  { label: "Persuade", prompt: "Rewrite this section to be more persuasive and compelling.", icon: Sparkles },
  { label: "Add Details", prompt: "Expand this section with more detailed and specific information.", icon: FileText },
  { label: "Concise", prompt: "Shorten this section while keeping the key points.", icon: Zap },
  { label: "Add Stats", prompt: "Include relevant statistics or data to support the content.", icon: Sparkles },
  { label: "Professional", prompt: "Rewrite in a more professional and formal tone.", icon: Sparkles },
  { label: "Client Focus", prompt: "Emphasize benefits for the client and their business.", icon: Sparkles },
];

export function AISidePanel({
  sections,
  projectTitle,
  clientName,
  onSectionUpdate,
  className,
}: AISidePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-select first section
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const handleGenerate = useCallback(async () => {
    if (!selectedSection) return;
    if (!prompt.trim()) {
      toast.warning("Please enter a prompt or use a quick suggestion.");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const res = await fetch("/api/proposals/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          target: selectedSection.type || "custom",
          projectTitle,
          clientName,
          currentContent: selectedSection.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGeneratedContent(data.content);
      toast.success("AI generated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSection, prompt, projectTitle, clientName]);

  const handleApply = useCallback(() => {
    if (!selectedSection) return;
    if (!generatedContent) {
      toast.warning("No generated content to apply.");
      return;
    }

    onSectionUpdate(selectedSection.id, generatedContent);
    toast.success("Section updated!");
    setGeneratedContent("");
    setPrompt("");
  }, [selectedSection, generatedContent, onSectionUpdate]);

  const handleCopy = useCallback(async () => {
    if (!generatedContent) return;
    await navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("Copied to clipboard!");
  }, [generatedContent]);

  const handleRegenerate = useCallback(() => {
    setGeneratedContent("");
    handleGenerate();
  }, [handleGenerate]);

  const handleQuickPrompt = (suggestion: string) => {
    setPrompt(suggestion);
    // Auto-focus textarea
    textareaRef.current?.focus();
  };

  const handleClear = () => {
    setPrompt("");
    setGeneratedContent("");
  };

  // Toggle panel
  const toggleOpen = () => setIsOpen((prev) => !prev);

  // Panel width classes
  const panelWidth = isMobile ? "w-full" : "w-96";
  const translateClass = isOpen ? "translate-x-0" : "translate-x-full";

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed right-4 bottom-4 md:right-6 md:top-20 z-50 shadow-lg border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300 rounded-full h-12 w-12"
        onClick={toggleOpen}
      >
        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={toggleOpen}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-background/95 backdrop-blur-xl border-l border-primary/10 shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-in-out",
          panelWidth,
          translateClass,
          className
        )}
      >
        {/* Header with glass effect */}
        <div className="flex items-center justify-between p-5 border-b border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">AI Assistant</span>
              <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-wider bg-primary/5">
                Beta
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
              onClick={toggleOpen}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-5 space-y-6">
            {/* Section Selector */}
            <div className="space-y-2">
              <Label htmlFor="section-select" className="text-sm font-semibold text-muted-foreground">
                Target Section
              </Label>
              <Select
                value={selectedSectionId}
                onValueChange={(val) => {
                  setSelectedSectionId(val);
                  setGeneratedContent("");
                  setPrompt("");
                }}
              >
                <SelectTrigger id="section-select" className="w-full bg-muted/30 border-primary/20 focus:ring-primary/30 transition-all">
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title || `Section ${s.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Prompts - Grid layout with icons */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <Button
                    key={q.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 justify-start gap-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                    onClick={() => handleQuickPrompt(q.prompt)}
                  >
                    <q.icon className="h-3.5 w-3.5 text-primary/70" />
                    <span className="truncate">{q.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-semibold text-muted-foreground">
                Your Prompt
              </Label>
              <Textarea
                ref={textareaRef}
                id="prompt"
                placeholder="e.g., Rewrite this section to focus more on ROI..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none bg-muted/30 border-primary/20 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !selectedSection}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                disabled={!prompt && !generatedContent}
                className="border-primary/20 hover:bg-primary/10 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Generated Content Preview */}
            {generatedContent && (
              <div className="space-y-3 mt-2 p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-muted/50 backdrop-blur-sm shadow-inner animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-primary/80">âœ¨ Generated Preview</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-primary/10 transition-all"
                      onClick={handleCopy}
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {isCopied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-primary/10 transition-all"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <ScrollArea className="max-h-48 rounded-lg bg-background/80 p-3 text-sm whitespace-pre-wrap border border-primary/10">
                  {generatedContent}
                </ScrollArea>
                <Button
                  onClick={handleApply}
                  className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                  size="sm"
                >
                  <FileText className="h-4 w-4" />
                  Apply to Section
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer with subtle branding */}
        <div className="p-4 border-t border-primary/10 text-xs text-muted-foreground bg-muted/20 backdrop-blur-sm">
          <p className="flex items-center gap-2 justify-center">
            <Sparkles className="h-3 w-3 text-primary/60" />
            Powered by agency branding & project context
          </p>
        </div>
      </div>
    </>
  );
}