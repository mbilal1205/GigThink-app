"use client";

import { Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { CustomBlock } from "@/components/proposals/proposal-types";

interface ProposalCustomBlockCardProps {
  block: CustomBlock;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onRemove: () => void;
  onAiFill: () => void;
}

export function ProposalCustomBlockCard({
  block,
  onTitleChange,
  onContentChange,
  onRemove,
  onAiFill,
}: ProposalCustomBlockCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={block.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="font-semibold text-sm bg-transparent border-none focus-visible:ring-0 p-0"
          placeholder="Section title"
        />
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive h-8 w-8">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        rows={4}
        value={block.content}
        onChange={(e) => onContentChange(e.target.value)}
        className="text-sm leading-relaxed bg-muted/20"
        placeholder="Add your own proposal content here..."
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="print:hidden text-xs gap-1.5" onClick={onAiFill}>
          <Sparkles className="h-3.5 w-3.5" /> AI Fill
        </Button>
      </div>
    </div>
  );
}