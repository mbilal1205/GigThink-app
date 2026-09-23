"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApplyButtonProps {
  jobId: string;
  jobTitle?: string;
  jobCompany?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function ApplyButton({
  jobId,
  jobTitle = "",
  jobCompany = "",
  variant = "default",
  size = "sm",
  className = "",
}: ApplyButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);

  // Check existing application status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/apply/status?job_id=${jobId}`);
        const data = await res.json();
        if (res.ok && data.application) {
          setStatus(data.application.status);
        } else {
          setStatus(null);
        }
      } catch (err) {
        console.error("[APPLY_STATUS_CHECK]", err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [jobId]);

  const handlePrepare = async () => {
    setPreparing(true);
    try {
      const res = await fetch("/api/apply/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to prepare application");
      setStatus("ready");
      toast.success("Application prepared! Resume and cover letter ready.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPreparing(false);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
        Checking...
      </Button>
    );
  }

  if (status === "ready" || status === "submitted" || status === "viewed" || status === "interview") {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} border-emerald-500/30 text-emerald-400`}
        onClick={() => router.push("/applications")}
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        {status === "ready" ? "Prepared" : status.charAt(0).toUpperCase() + status.slice(1)}
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handlePrepare}
      disabled={preparing}
    >
      {preparing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Sparkles className="h-4 w-4 mr-1" />
      )}
      {preparing ? "Preparing..." : "Prepare Application"}
    </Button>
  );
}