"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: string;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  open,
  onOpenChange,
  actionType,
  onApprove,
  onReject,
  isLoading,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <DialogTitle>Confirm Action</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Kya aap waqai ye action perform karna chahte hain?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Action: <span className="font-medium text-foreground">{actionType}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ye action irreversible ho sakta hai. Please confirm.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReject} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onApprove} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
            {isLoading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}