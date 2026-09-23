"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Mail,
  FileText,
  Users,
  FolderKanban,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  sequences: { total: number; active: number; paused: number; completed: number; test: number };
  emails: { sent: number; scheduled: number; failed: number };
  clients: { total: number; recent: any[] };
  proposals: { total: number; active: number; won: number; lost: number; recent: any[] };
  projects: { total: number; active: number; completed: number; recent: any[] };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/overview");
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-10 text-muted-foreground">No data available.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 bg-transparent text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-bold heading-gradient flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Agency Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Your complete business overview â€” sequences, emails, proposals, clients, and projects.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Sequences Stats */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Email Sequences
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Sequences" value={data.sequences.total} icon={Mail} />
          <StatCard label="Active" value={data.sequences.active} icon={Activity} />
          <StatCard label="Paused" value={data.sequences.paused} icon={Clock} />
          <StatCard label="Completed" value={data.sequences.completed} icon={CheckCircle2} />
          <StatCard label="Test Sequences" value={data.sequences.test} icon={TrendingUp} />
        </div>
      </section>

      {/* Email Analytics */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Email Analytics
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Sent Emails" value={data.emails.sent} icon={CheckCircle2} />
          <StatCard label="Scheduled" value={data.emails.scheduled} icon={Clock} />
          <StatCard label="Failed" value={data.emails.failed} icon={XCircle} />
        </div>
      </section>

      {/* Proposals Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Proposals
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Proposals" value={data.proposals.total} icon={FileText} />
          <StatCard label="Active" value={data.proposals.active} icon={Activity} />
          <StatCard label="Won" value={data.proposals.won} icon={CheckCircle2} />
          <StatCard label="Lost" value={data.proposals.lost} icon={XCircle} />
        </div>
        <RecentList
          items={data.proposals.recent}
          renderItem={(item) => (
            <>
              <span className="font-medium truncate">{item.title || "Untitled"}</span>
              <Badge className={`ml-2 ${
                item.status === "accepted" ? "bg-emerald-500/10 text-emerald-400" :
                item.status === "rejected" ? "bg-red-500/10 text-red-400" :
                "bg-blue-500/10 text-blue-400"
              }`}>
                {item.status}
              </Badge>
            </>
          )}
        />
      </section>

      {/* Clients Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Clients
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Clients" value={data.clients.total} icon={Users} />
        </div>
        <RecentList
          items={data.clients.recent}
          renderItem={(client) => (
            <>
              <span className="font-medium truncate">{client.client_name || "Unnamed"}</span>
              {client.company_name && (
                <span className="text-xs text-muted-foreground ml-2">{client.company_name}</span>
              )}
            </>
          )}
        />
      </section>

      {/* Projects Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" /> Projects
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Projects" value={data.projects.total} icon={FolderKanban} />
          <StatCard label="Active" value={data.projects.active} icon={Activity} />
          <StatCard label="Completed" value={data.projects.completed} icon={CheckCircle2} />
        </div>
        <RecentList
          items={data.projects.recent}
          renderItem={(project) => (
            <>
              <span className="font-medium truncate">{project.title || "Untitled"}</span>
              <Badge className="ml-2">{project.status}</Badge>
            </>
          )}
        />
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentList({ items, renderItem }: { items: any[]; renderItem: (item: any) => React.ReactNode }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent items.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}