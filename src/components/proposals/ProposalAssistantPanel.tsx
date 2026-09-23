"use client";

import { useState } from "react";
import { Sparkles, Send, Bot, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomBlock, InsertTarget } from "./proposal-types";

interface ProposalAssistantPanelProps {
  projectTitle?: string;
  clientName?: string;
  proposalSummary?: string;
  customBlocks?: CustomBlock[];
  selectedCustomBlockId?: string | null;
  onTargetChange: (target: InsertTarget) => void;
  onInsert: (target: InsertTarget) => void;
  onCreateCustomBlock: () => void;
  onGenerateProposal: () => void;
  onPromptSubmit: (prompt: string) => void;
  onCustomBlockChange: (id: string) => void;
}

export function ProposalAssistantPanel({
  customBlocks = [],
  selectedCustomBlockId,
  onTargetChange,
  onInsert,
  onCreateCustomBlock,
  onGenerateProposal,
  onPromptSubmit,
  onCustomBlockChange,
}: ProposalAssistantPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [currentTarget, setCurrentTarget] = useState<InsertTarget>("executiveSummary");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onPromptSubmit(prompt);
    setPrompt("");
  };

  const handleTargetSelection = (value: string) => {
    const target = value as InsertTarget;
    setCurrentTarget(target);
    onTargetChange(target);
  };

  return (
    <Card className="border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" /> GigThink AI Architect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Target Section for AI</label>
            <Select value={currentTarget} onValueChange={handleTargetSelection}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Select target section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="executiveSummary" className="text-xs">Executive Summary</SelectItem>
                <SelectItem value="problemStatement" className="text-xs">Problem Statement</SelectItem>
                <SelectItem value="solutionOverview" className="text-xs">Solution Overview</SelectItem>
                <SelectItem value="customSection" className="text-xs">Custom Section Block</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentTarget === "customSection" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Select Custom Block</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCreateCustomBlock}
                  className="h-6 text-[10px] px-1.5 text-primary gap-1"
                >
                  <Plus className="h-3 w-3" /> New Block
                </Button>
              </div>
              <Select
                value={selectedCustomBlockId || ""}
                onValueChange={onCustomBlockChange}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Choose custom block..." />
                </SelectTrigger>
                <SelectContent>
                  {customBlocks.map((block) => (
                    <SelectItem key={block.id} value={block.id} className="text-xs">
                      {block.title || "Untitled Block"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Provide specific instructions or prompt the AI assistant to draft tailored content.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                rows={3}
                placeholder="e.g. Expand on technical architecture and security..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="text-xs resize-none"
              />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="w-full text-xs font-semibold gap-1.5">
                    <Send className="h-3 w-3" /> Run AI Prompt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onInsert(currentTarget)}
                    className="text-xs gap-1"
                    title="Insert AI Draft into Target"
                  >
                    Insert <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onGenerateProposal}
                  className="w-full text-xs font-semibold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Generate Full Architecture
                </Button>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}