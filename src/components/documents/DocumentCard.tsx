"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Pencil, Download, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DocumentViewModal from "./DocumentViewModal";
import DocumentEditModal from "./DocumentEditModal";

interface DocumentCardProps {
  type: "resume" | "cover";
  id: string;
  title: string;
  content: string; // for cover letter, this is plain text; for resume, may be JSON string
  updatedAt: string;
  onDelete: () => void;
  onUpdate: () => void;
}

export default function DocumentCard({
  type,
  id,
  title,
  content,
  updatedAt,
  onDelete,
  onUpdate,
}: DocumentCardProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [canvaConnected, setCanvaConnected] = useState(false);

  // Check Canva connection status on mount
  useEffect(() => {
    const checkCanva = async () => {
      try {
        const res = await fetch("/api/connections/canva/status");
        const data = await res.json();
        if (res.ok) setCanvaConnected(data.connected);
      } catch (err) {
        console.error("[CANVA_STATUS_CHECK]", err);
      }
    };
    if (type === "resume") checkCanva();
  }, [type]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (type === "resume") {
        // PDF download for resume
        const res = await fetch(`/api/resumes/${id}/pdf`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to download PDF");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || "resume"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Resume downloaded as PDF");
      } else {
        // Cover letter: download as plain text
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || type}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Cover letter downloaded");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenInCanva = async () => {
    if (!canvaConnected) {
      // Redirect to connect flow
      window.location.href = "/api/connections/canva/connect";
      return;
    }
    // If connected, future: call export API to create design
    toast.info("Canva export is coming soon. You're connected!");
  };

  return (
    <Card className="border border-white/10 bg-card/70 hover:bg-card/80 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Updated: {new Date(updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setViewOpen(true)} title="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download" disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>

        {/* Canva button for resumes */}
        {type === "resume" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleOpenInCanva}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {canvaConnected ? "Open in Canva" : "Connect Canva"}
          </Button>
        )}

        {/* Modals */}
        <DocumentViewModal
          open={viewOpen}
          onOpenChange={setViewOpen}
          title={title}
          content={content}
          type={type}
        />
        <DocumentEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          type={type}
          id={id}
          initialContent={content}
          initialTitle={title}
          onUpdate={onUpdate}
        />
      </CardContent>
    </Card>
  );
}