"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ProposalSectionCardProps {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onAiFill?: () => void;
  accentClassName?: string;
  icon?: ReactNode;
}

export function ProposalSectionCard({
  title,
  description,
  value,
  onChange,
  placeholder,
  onAiFill,
  accentClassName,
  icon,
}: ProposalSectionCardProps) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${accentClassName || "border-border bg-background"}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>

        {onAiFill ? (
          <Button variant="outline" size="sm" onClick={onAiFill} className="text-xs gap-1.5 print:hidden">
            <Sparkles className="h-3.5 w-3.5" /> AI Draft
          </Button>
        ) : null}
      </div>

      <Textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 text-sm leading-relaxed resize-y"
      />
    </div>
  );
}