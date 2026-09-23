"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ConfirmActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default" | "outline" | "secondary";
  icon?: React.ReactNode;
}

export function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  icon,
}: ConfirmActionDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success("Action completed");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-white/10 bg-card/95 backdrop-blur-md text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon || <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button variant="outline" onClick={onClose} disabled={loading} className="text-xs">
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}