"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

interface BriefingData {
  date: string;
  projectTitle: string;
  message: string;
  topTasks: Array<{ taskId: string; title: string; estimatedHours: number; priority: string; dueDate?: string }>;
  warnings: string[];
}

export function DailyBriefingCard({ projectId }: { projectId: string }) {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-briefing`);
      if (!res.ok) throw new Error("Failed to get briefing");
      const data = await res.json();
      setBriefing(data.briefing);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [projectId]);

  if (loading && !briefing) {
    return (
      <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!briefing) return null;

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 40) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  // Extract health score from message (fallback)
  const healthScoreMatch = briefing.message.match(/Health Score:\s*(\d+)/i);
  const healthScore = healthScoreMatch ? parseInt(healthScoreMatch[1]) : null;

  return (
    <Card className="border-white/10 bg-card/70 backdrop-blur-sm card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Daily Briefing
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchBriefing}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact Summary */}
        <div className="space-y-3">
          {healthScore !== null && (
            <div className="flex items-center gap-2">
              <Badge className={`${getHealthColor(healthScore)} text-xs font-semibold px-2.5 py-0.5`}>
                Health Score: {healthScore}/100
              </Badge>
            </div>
          )}

          {briefing.topTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Today's Top Priorities
              </p>
              <ul className="space-y-1.5">
                {briefing.topTasks.map((task) => (
                  <li key={task.taskId} className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {task.title}
                    </span>
                    <span className="text-muted-foreground">{task.estimatedHours}h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {briefing.warnings.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{briefing.warnings.length} warning{briefing.warnings.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs justify-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Hide Full Briefing
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> View Full Briefing
            </>
          )}
        </Button>

        {/* Expanded Full Message */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                    h2: ({ children }) => <h4 className="text-sm font-bold mb-1.5">{children}</h4>,
                    h3: ({ children }) => <h5 className="text-xs font-semibold mb-1">{children}</h5>,
                    p: ({ children }) => <p className="mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="ml-4 list-disc my-2">{children}</ul>,
                    ol: ({ children }) => <ol className="ml-4 list-decimal my-2">{children}</ol>,
                    li: ({ children }) => <li className="text-xs">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    hr: () => <hr className="border-white/10 my-3" />,
                  }}
                >
                  {briefing.message}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}