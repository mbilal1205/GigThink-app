"use client";

import { ArrowLeft, Sparkles, Copy, Check, Download, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ProposalHeaderProps {
  onCopy: () => void;
  onExportPDF: () => void;
  onSave: () => void;
  copied: boolean;
  isDownloading: boolean;
  saving: boolean;
}

export function ProposalHeader({
  onCopy,
  onExportPDF,
  onSave,
  copied,
  isDownloading,
  saving,
}: ProposalHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 rounded-3xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> GigThink Proposal Studio
          </h1>
          <p className="text-xs text-muted-foreground">
            Professional 7-Block Enterprise Architecture
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}{" "}
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={onExportPDF} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 text-blue-500" />
          )}{" "}
          PDF
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5">
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}{" "}
          Save
        </Button>
      </div>
    </div>
  );
}