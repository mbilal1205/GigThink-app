"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ResumeViewer from "./ResumeViewer";

interface DocumentViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string; // for resume, may be JSON string
  type: "resume" | "cover";
}

export default function DocumentViewModal({
  open,
  onOpenChange,
  title,
  content,
  type,
}: DocumentViewModalProps) {
  // Try to parse resume JSON
  let parsedResume = null;
  if (type === "resume") {
    try {
      parsedResume = JSON.parse(content);
    } catch {
      parsedResume = null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {type === "resume" && parsedResume ? (
            <ResumeViewer resume={parsedResume} />
          ) : (
            <div className="p-4 bg-white/5 rounded-lg whitespace-pre-wrap text-sm text-muted-foreground">
              {content}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}