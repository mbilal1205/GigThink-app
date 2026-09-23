"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ProposalError() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto my-16 text-center space-y-4 p-8 border rounded-2xl bg-card">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
      <h3 className="text-lg font-bold">Proposal Unavailable</h3>
      <Button onClick={() => router.back()} variant="outline">
        Go Back
      </Button>
    </div>
  );
}