"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits");
        const data = await res.json();
        if (res.ok) {
          setCredits(data.credits);
          setPremium(data.isPremium);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCredits();
  }, []);

  if (premium) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 gap-1">
        <Zap className="h-3 w-3" /> Unlimited
      </Badge>
    );
  }

  if (credits === null) {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  }

  return (
    <Badge
      className={cn(
        "gap-1",
        credits <= 10
          ? "bg-red-500/10 text-red-300 border-red-500/30"
          : "bg-primary/10 text-primary border-primary/30"
      )}
    >
      <Zap className="h-3 w-3" /> {credits} Credits
    </Badge>
  );
}