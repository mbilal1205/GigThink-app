"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export function LogsTab({ logs, loading }: { logs: any[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Loading logs...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-xl border border-white/10">
        <p className="text-muted-foreground">No follow-up emails sent yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="border-white/10 bg-card/70 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{log.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{log.to_email}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {new Date(log.sent_at).toLocaleString()}
                </p>
              </div>
              <Badge className={`${
                log.status === "sent" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                log.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-gray-500/10 text-gray-400 border-gray-500/20"
              }`}>
                {log.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}