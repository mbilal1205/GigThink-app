"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface HealthData {
  score: number;
  status: "healthy" | "at_risk" | "critical";
  progress: number;
  expectedProgress: number;
  delayDays: number;
  overdueTasks: number;
  blockedTasks: number;
  totalTasks: number;
  completedTasks: number;
  message: string;
}

interface RiskAlert {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export function ProjectHealthCard({ projectId }: { projectId: string }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [risks, setRisks] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/health`);
        if (!res.ok) throw new Error("Failed to load health");
        const data = await res.json();
        setHealth(data.health);
        setRisks(data.risks || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="border-white/10 bg-card/70">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  const statusConfig = {
    healthy: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Healthy" },
    at_risk: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "At Risk" },
    critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Critical" },
  }[health.status];

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-white/10 bg-card/70 backdrop-blur-sm card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            Project Health
          </span>
          <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Health Score</span>
            <span className="font-bold">{health.score}/100</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${health.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full ${
                health.status === "healthy"
                  ? "bg-emerald-500"
                  : health.status === "at_risk"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold">{health.progress}%</p>
            <p className="text-[10px] text-muted-foreground">Progress</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-400">{health.overdueTasks}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-400">{health.blockedTasks}</p>
            <p className="text-[10px] text-muted-foreground">Blocked</p>
          </div>
        </div>

        {health.message && (
          <p className="text-xs text-muted-foreground">{health.message}</p>
        )}

        {risks.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risks
            </p>
            {risks.slice(0, 3).map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                <span>{risk.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}