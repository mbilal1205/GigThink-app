"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Eye,
  Clock,
  DollarSign,
  CheckCircle,
  Clock3,
  Send,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Building2,
  User,
  Layers,
  Copy,
  Share2,
  BarChart3,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConfirmActionDialog } from "@/components/ui/confirm-delete-dialog";

// â”€â”€ Types â”€â”€
interface ProposalItem {
  _id: string;
  projectId?: string; // âœ… Added
  title: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  status: string;
  version: number;
  sectionsCount: number;
  totalBudget: number;
  currency: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  shareLink?: string | null;
  views: number;
  lastViewedAt?: string | null;
  clientAction?: string | null;
  events?: Array<{ event: string; timestamp: string; metadata?: string }>;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    color: "bg-gray-500/10 text-gray-400 border border-gray-500/30",
    icon: Clock3,
  },
  review: {
    label: "In Review",
    color: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30",
    icon: Eye,
  },
  sent: {
    label: "Sent",
    color: "bg-blue-500/10 text-blue-300 border border-blue-500/30",
    icon: Send,
  },
  accepted: {
    label: "Accepted",
    color: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-300 border border-red-500/30",
    icon: XCircle,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterClientId = searchParams.get("clientId") ?? "";
  const filterClientName = searchParams.get("clientName") ?? "";

  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "budget-high" | "budget-low" | "name"
  >("newest");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProposalItem | null>(null);
  // â”€â”€ Fetch proposals â”€â”€
  const fetchProposals = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        else setRefreshing(true);
        setError(null);
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (filterClientId) params.append("clientId", filterClientId);
        params.append("limit", "50");

        const res = await fetch(`/api/proposals?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load proposals");
        }
        const data = await res.json();
        const proposalsWithDefaults: ProposalItem[] = (
          data.proposals ?? []
        ).map((p: any) => ({
          ...p,
          projectId: p.projectId || null, // âœ… Make sure projectId is mapped
          views: p.views ?? 0,
          lastViewedAt: p.lastViewedAt ?? null,
          clientAction: p.clientAction ?? "none",
          shareLink: p.shareLink ?? null,
          events: p.events ?? [],
        }));
        setProposals(proposalsWithDefaults);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (!isBackground) setError(message);
        else toast.error(message);
      } finally {
        if (!isBackground) setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, filterClientId],
  );

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    const interval = setInterval(() => fetchProposals(true), 30000);
    return () => clearInterval(interval);
  }, [fetchProposals]);

  // â”€â”€ Filtered & sorted â”€â”€
  const filteredProposals = useMemo(() => {
    let result = proposals.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        (p.clientCompany ?? "").toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    });
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "budget-high":
          return (b.totalBudget ?? 0) - (a.totalBudget ?? 0);
        case "budget-low":
          return (a.totalBudget ?? 0) - (b.totalBudget ?? 0);
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return result;
  }, [proposals, searchQuery, sortBy]);

  // â”€â”€ Stats â”€â”€
  const stats = useMemo(() => {
    const total = proposals.length;
    const draft = proposals.filter((p) => p.status === "draft").length;
    const review = proposals.filter((p) => p.status === "review").length;
    const sent = proposals.filter((p) => p.status === "sent").length;
    const opened = proposals.filter((p) => p.views > 0).length;
    const accepted = proposals.filter(
      (p) => p.status === "accepted" || p.clientAction === "accepted",
    ).length;
    const rejected = proposals.filter(
      (p) => p.status === "rejected" || p.clientAction === "rejected",
    ).length;
    const changesReq = proposals.filter(
      (p) => p.clientAction === "changes_requested",
    ).length;
    const totalBudget = proposals.reduce(
      (sum, p) => sum + (p.totalBudget ?? 0),
      0,
    );
    const distribution = [
      { status: "Draft", count: draft, color: "bg-gray-400" },
      { status: "Review", count: review, color: "bg-yellow-500" },
      { status: "Sent", count: sent, color: "bg-blue-500" },
      { status: "Opened", count: opened, color: "bg-orange-500" },
      { status: "Accepted", count: accepted, color: "bg-emerald-500" },
      { status: "Rejected", count: rejected, color: "bg-red-500" },
      { status: "Changes", count: changesReq, color: "bg-purple-500" },
    ];
    return {
      total,
      draft,
      review,
      sent,
      opened,
      accepted,
      rejected,
      changesReq,
      totalBudget,
      distribution,
    };
  }, [proposals]);

  const recentActivity = useMemo(() => {
    const allEvents = proposals.flatMap((p) =>
      (p.events ?? []).map((e) => ({
        ...e,
        proposalTitle: p.title,
        proposalId: p._id,
      })),
    );
    return allEvents
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 5);
  }, [proposals]);

  // âœ… Fixed handleOpenProposal: accepts ProposalItem and uses projectId
  const handleOpenProposal = (proposal: ProposalItem) => {
    if (proposal.projectId) {
      router.push(`/projects/${proposal.projectId}`);
    } else {
      toast.error("Project ID not found for this proposal");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget._id);
    try {
      const res = await fetch(`/api/proposals/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      toast.success("Proposal deleted permanently");
      setProposals((prev) => prev.filter((p) => p._id !== deleteTarget._id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const handleExportPDF = async (proposalId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExporting(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/pdf`);
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Proposal_${proposalId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setExporting(null);
    }
  };

  const handleShare = async (proposalId: string) => {
    setSharing(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/share`, {
        method: "POST",
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to generate link");
      const data = await res.json();
      setShareLink(data.shareLink);
      setShareModalOpen(true);
      fetchProposals();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSharing(null);
    }
  };

  // â”€â”€ Loading Skeleton â”€â”€
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // â”€â”€ Render â”€â”€
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 bg-transparent text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold heading-gradient flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            {filterClientName ? (
              <span>
                Proposals for{" "}
                <span className="text-primary">{filterClientName}</span>
              </span>
            ) : (
              "Proposal Dashboard"
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-1">
            Realâ€‘time engagement tracking â€¢ Autoâ€‘refreshes every 30s
          </p>
        </div>
        <div className="flex gap-2">
          {filterClientId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/clients")}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-xs"
            >
              <Building2 className="h-4 w-4 mr-2" /> Back to Clients
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchProposals(true)}
            disabled={refreshing}
            className="h-9 w-9 text-muted-foreground hover:text-white"
          >
            <RefreshCw
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/clients")}
            className="btn-gradient text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-2" /> New Proposal
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Layers,
            color: "text-primary",
          },
          {
            label: "Sent",
            value: stats.sent,
            icon: Send,
            color: "text-blue-400",
          },
          {
            label: "Opened",
            value: stats.opened,
            icon: Eye,
            color: "text-orange-400",
          },
          {
            label: "Accepted",
            value: stats.accepted,
            icon: CheckCircle,
            color: "text-emerald-400",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            color: "text-red-400",
          },
          {
            label: "Changes",
            value: stats.changesReq,
            icon: MessageSquare,
            color: "text-purple-400",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border border-white/10 bg-card/70 backdrop-blur-sm hover:bg-card/80 transition-colors"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Value */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Total Pipeline Value:{" "}
          <span className="font-bold text-emerald-400">
            ${stats.totalBudget.toLocaleString()}
          </span>
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Activity className="h-3 w-3" /> Autoâ€‘refresh active
        </p>
      </div>

      {/* Proposal Funnel */}
      {proposals.length > 0 && (
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 heading-gradient">
              <TrendingUp className="h-5 w-5" /> Proposal Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.distribution.map((item) => {
                const percent =
                  stats.total > 0
                    ? Math.round((item.count / stats.total) * 100)
                    : 0;
                return (
                  <div
                    key={item.status}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span className="w-20 font-medium">{item.status}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 heading-gradient">
              <Activity className="h-5 w-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {recentActivity.map((event, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  <span className="font-medium text-foreground/90">
                    {event.proposalTitle}
                  </span>{" "}
                  â€“ {event.event}
                  <span className="ml-auto text-[10px]">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white/5 border-white/10 focus:ring-1 ring-primary/40"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-white/5 border-white/10">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-card/90 backdrop-blur-md">
            <SelectItem value="all" className="text-xs">
              All Status
            </SelectItem>
            <SelectItem value="draft" className="text-xs">
              Draft
            </SelectItem>
            <SelectItem value="review" className="text-xs">
              In Review
            </SelectItem>
            <SelectItem value="sent" className="text-xs">
              Sent
            </SelectItem>
            <SelectItem value="accepted" className="text-xs">
              Accepted
            </SelectItem>
            <SelectItem value="rejected" className="text-xs">
              Rejected
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as typeof sortBy)}
        >
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-white/5 border-white/10">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-card/90 backdrop-blur-md">
            <SelectItem value="newest" className="text-xs">
              Newest First
            </SelectItem>
            <SelectItem value="oldest" className="text-xs">
              Oldest First
            </SelectItem>
            <SelectItem value="budget-high" className="text-xs">
              Budget: High to Low
            </SelectItem>
            <SelectItem value="budget-low" className="text-xs">
              Budget: Low to High
            </SelectItem>
            <SelectItem value="name" className="text-xs">
              Name A-Z
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3 opacity-80" />
            <p className="text-sm text-destructive font-medium mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProposals()}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-xs"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!error && filteredProposals.length === 0 && (
        <Card className="border border-dashed border-white/10 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-20 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-bold mb-2 heading-gradient">
              {searchQuery ? "No matching proposals" : "No proposals yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search or filters."
                : "Generate your first AIâ€‘powered proposal for a client."}
            </p>
            <Button
              size="sm"
              onClick={() => router.push("/clients")}
              className="btn-gradient"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Proposal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PROPOSAL CARDS */}
      {filteredProposals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProposals.map((proposal) => {
            const statusCfg =
              STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            const isSharing = sharing === proposal._id;
            const isDeleting = deleting === proposal._id;
            const isExporting = exporting === proposal._id;

            return (
              <Card
                key={proposal._id}
                className="border border-white/10 bg-card/70 backdrop-blur-sm hover:bg-card/80 transition-colors cursor-pointer group overflow-hidden relative"
                onClick={() => handleOpenProposal(proposal)}
              >
                {/* status bar */}
                <div
                  className={cn(
                    "h-1",
                    proposal.status === "accepted"
                      ? "bg-emerald-500/80"
                      : proposal.status === "sent"
                        ? "bg-blue-500/80"
                        : proposal.status === "rejected"
                          ? "bg-red-500/80"
                          : proposal.status === "review"
                            ? "bg-yellow-500/80"
                            : "bg-gray-500/80",
                  )}
                />

                {/* Loading overlay */}
                {(isDeleting || isExporting) && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge
                      className={`${statusCfg.color} gap-1.5 text-[10px] font-medium px-2 py-0`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white -mr-1"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 border border-white/10 bg-card/90 backdrop-blur-md"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProposal(proposal);
                          }}
                          className="text-xs"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleExportPDF(proposal._id, e)}
                          className="text-xs"
                        >
                          <Download className="h-4 w-4 mr-2" /> Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(proposal._id);
                          }}
                          className="text-xs"
                        >
                          <Share2 className="h-4 w-4 mr-2" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(proposal);
                          }}
                          className="text-xs text-red-400 focus:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {proposal.title}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-xs flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                      <span className="font-medium">
                        {proposal.clientName || "Unknown"}
                      </span>
                    </p>
                    {proposal.clientCompany && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 ml-0.5">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {proposal.clientCompany}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {proposal.views ?? 0} views
                    </span>
                    {proposal.lastViewedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(proposal.lastViewedAt).toLocaleDateString()}
                      </span>
                    )}
                    {proposal.clientAction &&
                      proposal.clientAction !== "none" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-white/10 text-muted-foreground border-white/10"
                        >
                          {proposal.clientAction === "changes_requested"
                            ? "Changes req."
                            : proposal.clientAction}
                        </Badge>
                      )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(proposal.updatedAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Layers className="h-3 w-3" />
                      {proposal.sectionsCount} sections
                    </span>
                    {proposal.totalBudget > 0 && (
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <DollarSign className="h-3 w-3" />
                        {proposal.currency}{" "}
                        {proposal.totalBudget.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Share button */}
                  <div className="pt-1">
                    {proposal.shareLink ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-8 border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareLink(proposal.shareLink!);
                          setShareModalOpen(true);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy Share Link
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs h-8 bg-white/5 hover:bg-white/10"
                        disabled={isSharing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(proposal._id);
                        }}
                      >
                        {isSharing ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Share2 className="h-3 w-3 mr-1" />
                        )}
                        {isSharing ? "Generating link..." : "Share with Client"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="border border-white/10 bg-card/90 backdrop-blur-md text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base">Proposal Share Link</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Copy this secure link and send it to your client. They can view
              and act on the proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={shareLink}
              readOnly
              className="text-xs bg-white/5 border-white/10"
            />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success("Link copied!");
              }}
              className="btn-gradient text-xs"
            >
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
  open={!!deleteTarget}
  onClose={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Delete Proposal?"
  description={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete its associated project.`}
/>
    </div>
  );
}
