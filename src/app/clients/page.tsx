"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Loader2,
  FolderKanban,
  DollarSign,
  Sparkles,
  Building2,
  Calendar,
  FileText,
  Eye,
  Edit,
  Plus,
  ChevronRight,
  List,
  Layers,
  RefreshCw,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  MoreVertical,
  Pencil,
  UserX,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { cn } from "@/lib/utils";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface Client {
  id: string;
  client_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  project_title: string;
  project_summary?: string;
  budget: number;
  currency: string;
  deadline?: string;
  status: 'lead' | 'proposal_sent' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface ProposalInfo {
  hasProposal: boolean;
  proposalId: string;
  projectId?: string; // âœ… Added for correct navigation
  proposalCount: number;
  lastChecked: number;
}

const EMPTY_CLIENT_FORM = {
  client_name: '',
  company_name: '',
  email: '',
  phone: '',
  project_title: '',
  project_summary: '',
  budget: 0,
  currency: 'USD',
  deadline: '',
  status: 'lead' as Client['status'],
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [clientProposals, setClientProposals] = useState<Record<string, ProposalInfo>>({});
  const [checkingProposals, setCheckingProposals] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_CLIENT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // â”€â”€â”€ Fetch proposals map for clients â”€â”€â”€
  const checkProposalsFresh = useCallback(async (clientsList: Client[]) => {
    if (!clientsList.length) return {};
    setCheckingProposals(true);
    const proposalsMap: Record<string, ProposalInfo> = {};
    await Promise.all(
      clientsList.map(async (client) => {
        try {
          const propRes = await fetch(`/api/proposals?clientId=${client.id}&limit=1`);
          if (propRes.ok) {
            const propData = await propRes.json();
            const total = propData.pagination?.total || 0;
            const proposals = propData.proposals || [];
            const first = proposals[0] || {};
            proposalsMap[client.id] = {
              hasProposal: total > 0 && proposals.length > 0,
              proposalId: first._id || '',
              projectId: first.projectId || '', // âœ… Store projectId
              proposalCount: total,
              lastChecked: Date.now(),
            };
          } else {
            proposalsMap[client.id] = { hasProposal: false, proposalId: '', projectId: '', proposalCount: 0, lastChecked: Date.now() };
          }
        } catch {
          proposalsMap[client.id] = { hasProposal: false, proposalId: '', projectId: '', proposalCount: 0, lastChecked: Date.now() };
        }
      })
    );
    setCheckingProposals(false);
    return proposalsMap;
  }, []);

  const fetchClients = useCallback(async (forceFresh = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/Clients");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch clients");
      const clientsList: Client[] = data.clients || [];
      const freshProposalsMap = await checkProposalsFresh(clientsList);
      if (mountedRef.current) {
        setClientProposals(freshProposalsMap);
        setClients(clientsList);
        setLastRefresh(new Date());
      }
    } catch (err: any) {
      toast.error("Failed to load clients");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [checkProposalsFresh]);

  useEffect(() => {
    mountedRef.current = true;
    fetchClients(true);
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') fetchClients(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchClients]);

  // â”€â”€â”€ Edit â”€â”€â”€
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      client_name: client.client_name || '',
      company_name: client.company_name || '',
      email: client.email || '',
      phone: client.phone || '',
      project_title: client.project_title || '',
      project_summary: client.project_summary || '',
      budget: client.budget || 0,
      currency: client.currency || 'USD',
      deadline: client.deadline || '',
      status: client.status || 'lead',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    setSavingEdit(true);
    try {
      const payload = {
        client_name: editForm.client_name,
        company_name: editForm.company_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        project_title: editForm.project_title,
        project_summary: editForm.project_summary || null,
        budget: editForm.budget,
        currency: editForm.currency,
        deadline: editForm.deadline || null,
        status: editForm.status,
      };
      const res = await fetch(`/api/Clients/${editingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update client");
      toast.success("âœ… Client updated successfully!");
      setEditDialogOpen(false);
      setEditingClient(null);
      fetchClients(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // â”€â”€â”€ Delete â”€â”€â”€
  const handleOpenDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/Clients/${deletingClient.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete client");
      toast.success("ðŸ—‘ï¸ Client deleted successfully!");
      setDeleteDialogOpen(false);
      setDeletingClient(null);
      fetchClients(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // â”€â”€â”€ Detail â”€â”€â”€
  const handleOpenDetail = (client: Client) => {
    setSelectedClient(client);
    setDetailDialogOpen(true);
  };

  // â”€â”€â”€ Generate Proposal (FIXED) â”€â”€â”€
  const handleGenerateProposal = async (client: Client) => {
    setGeneratingFor(client.id);
    toast.info(`Generating proposal for ${client.client_name}...`);
    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          projectTitle: client.project_title || `Proposal for ${client.client_name}`,
          rawConversation: `Client: ${client.client_name}\nCompany: ${client.company_name || "N/A"}\nProject: ${client.project_title}\nBudget: ${client.currency} ${client.budget}`,
          budget: client.budget || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      // âœ… Extract both IDs safely
      const projectId = data.projectId || data.proposal?.projectId || data.project?._id;
      const proposalId = data.proposalId || data.proposal?._id;

      setClientProposals(prev => ({
        ...prev,
        [client.id]: {
          hasProposal: true,
          proposalId: proposalId || '',
          projectId: projectId || '',
          proposalCount: (prev[client.id]?.proposalCount || 0) + 1,
          lastChecked: Date.now(),
        },
      }));
      toast.success("âœ… Proposal generated!");

      // Navigate using projectId if available, else fallback
      if (projectId) {
        router.push(`/projects/${projectId}/proposal`);
      } else if (proposalId) {
        const propRes = await fetch(`/api/proposals/${proposalId}`);
        const propData = await propRes.json();
        if (propData.proposal?.projectId) {
          router.push(`/projects/${propData.proposal.projectId}/proposal`);
        } else {
          router.push('/projects/list');
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  // â”€â”€â”€ View Proposal (FIXED) â”€â”€â”€
  const handleViewProposal = (client: Client) => {
    const info = clientProposals[client.id];
    if (info?.projectId) {
      router.push(`/projects/${info.projectId}/proposal`);
    } else {
      toast.error("Project ID not found. Refreshing...");
      fetchClients(true);
    }
  };

  // â”€â”€â”€ View All Proposals â”€â”€â”€
  const handleViewAllProposals = (client: Client) => {
    router.push(`/projects/list?clientId=${client.id}&clientName=${encodeURIComponent(client.client_name)}`);
  };

  // â”€â”€â”€ Create Additional Proposal (FIXED) â”€â”€â”€
  const handleCreateAdditional = async (client: Client) => {
    setGeneratingFor(client.id);
    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          projectTitle: `${client.project_title || "Proposal"} v${(clientProposals[client.id]?.proposalCount || 0) + 1}`,
          rawConversation: `Additional proposal for ${client.client_name}`,
          budget: client.budget || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const projectId = data.projectId || data.proposal?.projectId || data.project?._id;
      const proposalId = data.proposalId || data.proposal?._id;

      setClientProposals(prev => ({
        ...prev,
        [client.id]: {
          ...prev[client.id],
          hasProposal: true,
          proposalId: proposalId || '',
          projectId: projectId || '',
          proposalCount: (prev[client.id]?.proposalCount || 0) + 1,
          lastChecked: Date.now(),
        },
      }));
      toast.success("âœ… Additional proposal created!");
      if (projectId) router.push(`/projects/${projectId}/proposal`);
      else if (proposalId) {
        const propRes = await fetch(`/api/proposals/${proposalId}`);
        const propData = await propRes.json();
        if (propData.proposal?.projectId) {
          router.push(`/projects/${propData.proposal.projectId}/proposal`);
        } else {
          router.push('/projects/list');
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  // â”€â”€â”€ Status Badge â”€â”€â”€
  const getStatusBadge = (status: Client['status']) => {
    const configs: Record<string, { label: string; className: string }> = {
      lead: { label: "New Lead", className: "bg-amber-500/10 text-amber-300 border border-amber-500/30" },
      proposal_sent: { label: "Proposal Sent", className: "bg-blue-500/10 text-blue-300 border border-blue-500/30" },
      active: { label: "Active", className: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" },
      completed: { label: "Completed", className: "bg-purple-500/10 text-purple-300 border border-purple-500/30" },
      archived: { label: "Archived", className: "bg-gray-500/10 text-gray-400 border border-gray-500/30" },
    };
    const config = configs[status] || configs.lead;
    return (
      <Badge variant="outline" className={`${config.className} text-[10px] font-medium px-2 py-0.5`}>
        {config.label}
      </Badge>
    );
  };

  // â”€â”€â”€ Loading State â”€â”€â”€
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading clients...</p>
      </div>
    );
  }

  // â”€â”€â”€ Stats â”€â”€â”€
  const realStats = {
    totalClients: clients.length,
    withProposals: Object.values(clientProposals).filter(p => p.hasProposal && p.proposalCount > 0).length,
    totalProposals: Object.values(clientProposals).reduce((sum, p) => sum + (p.hasProposal ? p.proposalCount : 0), 0),
    active: clients.filter(c => c.status === 'active').length,
  };

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold heading-gradient flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              Client Directory
            </h1>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Manage clients, generate AI proposals, edit & delete.
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => fetchClients(true)} disabled={checkingProposals} className="h-9 w-9 text-muted-foreground hover:text-white">
                  <RefreshCw className={`h-4 w-4 ${checkingProposals ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button variant="outline" size="sm" onClick={() => router.push("/projects/list")} className="gap-2 text-xs h-9 border-white/10 bg-white/5 hover:bg-white/10">
              <Layers className="h-4 w-4" /> All Proposals
            </Button>
            <CreateClientDialog onClientCreated={() => fetchClients(true)} />
          </div>
        </div>

        {/* Stats Overview */}
        {clients.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Clients", value: realStats.totalClients, icon: Users, color: "text-primary" },
              { label: "With Proposals", value: realStats.withProposals, icon: FileText, color: "text-emerald-400" },
              { label: "Total Proposals", value: realStats.totalProposals, icon: Layers, color: "text-purple-400" },
              { label: "Active", value: realStats.active, icon: Sparkles, color: "text-amber-400" },
            ].map((stat, idx) => (
              <Card key={idx} className="border border-white/10 bg-card/70 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5"><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                  <div>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {clients.length === 0 ? (
          <Card className="border border-white/10 bg-card/50 backdrop-blur-sm py-20 text-center">
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary"><FolderKanban className="h-10 w-10" /></div>
              <h3 className="text-xl font-bold heading-gradient">No Clients Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Add your first client to start generating professional AI-powered proposals.
              </p>
              <CreateClientDialog onClientCreated={() => fetchClients(true)} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, index) => {
              const info = clientProposals[client.id];
              const hasProposal = info?.hasProposal && info?.proposalCount > 0;
              const proposalCount = hasProposal ? info.proposalCount : 0;

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card className="border border-white/10 bg-card/70 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 flex flex-col group overflow-hidden h-full hover:shadow-lg hover:border-primary/30">
                    <div className={`h-1 ${hasProposal ? 'bg-emerald-500/80' : 'bg-primary/40'}`} />

                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <CardTitle 
                            className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                            onClick={() => handleOpenDetail(client)}
                          >
                            {client.project_title || client.client_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Building2 className="h-3 w-3 text-primary/70 shrink-0" />
                            <span className="truncate font-medium">
                              {client.client_name}
                              {client.company_name ? ` â€¢ ${client.company_name}` : ''}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {hasProposal && (
                            <Badge className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5">
                              <FileText className="h-3 w-3" />{proposalCount}
                            </Badge>
                          )}
                          {getStatusBadge(client.status)}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white -mr-1">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 border border-white/10 bg-card/90 backdrop-blur-md">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDetail(client); }} className="text-xs">
                                <Info className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }} className="text-xs">
                                <Pencil className="h-4 w-4 mr-2" /> Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleOpenDelete(client); }}
                                className="text-xs text-red-400 focus:text-red-300"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 text-sm flex-1 flex flex-col px-4">
                      {client.project_summary && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">"{client.project_summary}"</p>
                      )}

                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        {client.email && (
                          <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-primary/70 shrink-0" />{client.email}</p>
                        )}
                        {client.phone && (
                          <p className="flex items-center gap-1.5 truncate"><Phone className="h-3 w-3 text-primary/70 shrink-0" />{client.phone}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {client.currency || "USD"} {client.budget ? client.budget.toLocaleString() : "N/A"}
                          </span>
                        </div>
                        {client.deadline ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="font-medium truncate">{new Date(client.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                            <span className="text-gray-500">No deadline</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 mt-auto space-y-2">
                        {!hasProposal ? (
                          <Button
                            className="w-full text-xs font-semibold gap-2 btn-gradient h-9"
                            onClick={() => handleGenerateProposal(client)}
                            disabled={generatingFor === client.id}
                          >
                            {generatingFor === client.id ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                            ) : (
                              <><Sparkles className="h-4 w-4 text-amber-300" /> Generate AI Proposal</>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Button
                              className="w-full text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-500 h-9"
                              onClick={() => handleViewProposal(client)}
                            >
                              <Eye className="h-4 w-4" /> View Latest Proposal
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="outline" className="flex-1 text-[11px] font-medium gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 h-8" onClick={() => handleViewAllProposals(client)}>
                                <List className="h-3.5 w-3.5" /> All ({proposalCount})
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/90 backdrop-blur-md border border-white/10 text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pencil className="h-5 w-5 text-primary" /> Edit Client
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update client information and project details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Client Name *</Label>
                <Input 
                  value={editForm.client_name} 
                  onChange={(e) => setEditForm({...editForm, client_name: e.target.value})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company</Label>
                <Input 
                  value={editForm.company_name} 
                  onChange={(e) => setEditForm({...editForm, company_name: e.target.value})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Project Title *</Label>
                <Input 
                  value={editForm.project_title} 
                  onChange={(e) => setEditForm({...editForm, project_title: e.target.value})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Project Summary</Label>
                <Textarea 
                  rows={3} 
                  value={editForm.project_summary} 
                  onChange={(e) => setEditForm({...editForm, project_summary: e.target.value})} 
                  className="text-xs bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Budget</Label>
                <Input 
                  type="number" 
                  value={editForm.budget} 
                  onChange={(e) => setEditForm({...editForm, budget: Number(e.target.value)})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Currency</Label>
                <Select value={editForm.currency} onValueChange={(v) => setEditForm({...editForm, currency: v})}>
                  <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-card/90 backdrop-blur-md">
                    <SelectItem value="USD" className="text-xs">USD</SelectItem>
                    <SelectItem value="EUR" className="text-xs">EUR</SelectItem>
                    <SelectItem value="GBP" className="text-xs">GBP</SelectItem>
                    <SelectItem value="PKR" className="text-xs">PKR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Deadline</Label>
                <Input 
                  type="date" 
                  value={editForm.deadline?.split('T')[0] || ''} 
                  onChange={(e) => setEditForm({...editForm, deadline: e.target.value})} 
                  className="h-9 text-xs bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v as Client['status']})}>
                  <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-card/90 backdrop-blur-md">
                    <SelectItem value="lead" className="text-xs">New Lead</SelectItem>
                    <SelectItem value="proposal_sent" className="text-xs">Proposal Sent</SelectItem>
                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                    <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)} className="text-xs h-9">Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit || !editForm.client_name || !editForm.project_title} className="text-xs h-9 btn-gradient">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md bg-card/90 backdrop-blur-md border border-white/10 text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-base">
                <Trash2 className="h-5 w-5" /> Delete Client
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This action cannot be undone. All data including proposals will be permanently deleted.
              </DialogDescription>
            </DialogHeader>

            {deletingClient && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{deletingClient.client_name}</p>
                {deletingClient.company_name && <p className="text-xs text-muted-foreground">{deletingClient.company_name}</p>}
                {deletingClient.email && <p className="text-xs text-muted-foreground">{deletingClient.email}</p>}
                <p className="text-xs font-medium text-destructive">
                  Proposals: {clientProposals[deletingClient.id]?.proposalCount || 0}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-xs h-9">Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting} className="text-xs h-9">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {deleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-lg bg-card/90 backdrop-blur-md border border-white/10 text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-primary" /> Client Details
              </DialogTitle>
            </DialogHeader>

            {selectedClient && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{selectedClient.client_name}</h3>
                    {selectedClient.company_name && <p className="text-xs text-muted-foreground">{selectedClient.company_name}</p>}
                    {getStatusBadge(selectedClient.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {selectedClient.email && (
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedClient.email}</div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedClient.phone}</div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-sm font-semibold">Project: {selectedClient.project_title || "N/A"}</p>
                  {selectedClient.project_summary && <p className="text-xs text-muted-foreground">{selectedClient.project_summary}</p>}
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald-400"> {selectedClient.currency} {selectedClient.budget?.toLocaleString() || "N/A"}</span>
                    {selectedClient.deadline && <span> {new Date(selectedClient.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10 bg-white/5 hover:bg-white/10" onClick={() => { setDetailDialogOpen(false); handleOpenEdit(selectedClient); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10 bg-white/5 hover:bg-white/10" onClick={() => handleViewAllProposals(selectedClient)}>
                    <FileText className="h-4 w-4 mr-2" /> Proposals
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}