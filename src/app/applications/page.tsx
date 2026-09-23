"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ui/confirm-delete-dialog";

interface Application {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  jobs?: {
    title: string;
    company: string;
    location: string;
    remote_type: string;
  };
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load applications");
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openDeleteDialog = (app: Application) => {
    setDeleteTarget(app);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/applications/${deleteTarget.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    toast.success("Application deleted");
    fetchApplications();
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return { color: "bg-gray-500/10 text-gray-400 border-gray-500/30", label: "Preparing", icon: Clock };
      case "ready":
        return { color: "bg-blue-500/10 text-blue-400 border-blue-500/30", label: "Ready", icon: CheckCircle2 };
      case "applying":
        return { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", label: "Applying", icon: Loader2 };
      case "submitted":
        return { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", label: "Submitted", icon: CheckCircle2 };
      case "viewed":
        return { color: "bg-purple-500/10 text-purple-400 border-purple-500/30", label: "Viewed", icon: Eye };
      case "interview":
        return { color: "bg-blue-500/10 text-blue-400 border-blue-500/30", label: "Interview", icon: CheckCircle2 };
      case "rejected":
        return { color: "bg-red-500/10 text-red-400 border-red-500/30", label: "Rejected", icon: XCircle };
      default:
        return { color: "bg-gray-500/10 text-gray-400 border-gray-500/30", label: status, icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="text-center py-20 text-red-400">
        <p>Error: {error}</p>
        <Button variant="outline" onClick={fetchApplications} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (applications.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-20">
        <div className="rounded-full bg-white/5 p-5">
          <Inbox className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No applications yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start preparing applications from your career feed.
        </p>
        <Button onClick={() => router.push("/career-feed")} className="btn-gradient">
          Browse Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
      <h1 className="text-2xl font-bold heading-gradient">ðŸ“‹ My Applications</h1>
      <p className="text-sm text-muted-foreground">Track your job applications and their status.</p>

      <div className="space-y-3 mt-6">
        {applications.map((app) => {
          const statusBadge = getStatusBadge(app.status);
          const StatusIcon = statusBadge.icon;
          return (
            <Card key={app.id} className="border border-white/10 bg-card/70 hover:bg-card/80 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {app.jobs?.title || "Unknown Job"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.jobs?.company} {app.jobs?.location && `Â· ${app.jobs.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn(statusBadge.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(app)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete Application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Popup */}
      <ConfirmActionDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Application?"
        description={`Are you sure you want to delete the application for "${deleteTarget?.jobs?.title || 'this job'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        icon={<Trash2 className="w-5 h-5 text-red-500" />}
      />
    </div>
  );
}