'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, Eye, Clock, X, FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LeadHistory {
  id: string;
  source_url: string | null;
  source_text: string | null;
  result: any;
  created_at: string;
}

export default function ParserHistoryPage() {
  const [leads, setLeads] = useState<LeadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadHistory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadHistory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parser/history');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to load history');
      }
    } catch (err) {
      toast.error('Network error while loading history');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/parser/history/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== deleteTarget.id));
        if (selectedLead?.id === deleteTarget.id) setSelectedLead(null);
        toast.success('Lead deleted successfully');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error while deleting');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openDeleteDialog = (lead: LeadHistory) => {
    setDeleteTarget(lead);
  };

  const openLeadModal = (lead: LeadHistory) => {
    setSelectedLead(lead);
  };

  const closeModal = () => {
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen w-full hero-glow py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold heading-gradient">Parsed Leads History</h1>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No parsed leads yet.</p>
        ) : (
          <div className="space-y-4">
            {leads.map(lead => (
              <div key={lead.id} className="glass p-4 rounded-xl brand-border flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{lead.result?.summary?.split('.')[0] || 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                  {lead.source_url && (
                    <a
                      href={lead.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {lead.source_url}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openLeadModal(lead)}
                    className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(lead)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Lead Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="glass rounded-2xl brand-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold heading-gradient">
                    {selectedLead.result?.summary?.split('.')[0] || 'Lead Details'}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedLead.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedLead.result && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Summary</p>
                    <p className="text-foreground">{selectedLead.result.summary}</p>
                  </div>
                  {selectedLead.result.skills?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.result.skills.map((skill: string) => (
                          <span key={skill} className="px-3 py-1 rounded-md bg-secondary/50 border border-border text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Budget</p>
                      <p className="text-foreground">
                        {selectedLead.result.budget_min && selectedLead.result.budget_max
                          ? `$${selectedLead.result.budget_min} - $${selectedLead.result.budget_max}`
                          : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Urgency</p>
                      <p className="text-foreground capitalize">{selectedLead.result.urgency}</p>
                    </div>
                  </div>
                  {selectedLead.result.requirements_summary?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Key Requirements</p>
                      <ul className="space-y-2">
                        {selectedLead.result.requirements_summary.map((req: string, i: number) => (
                          <li key={i} className="text-sm text-foreground/90">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedLead.result.recommended_approach && (
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Recommended Approach</p>
                      <p className="text-sm text-foreground/90">{selectedLead.result.recommended_approach}</p>
                    </div>
                  )}
                  {selectedLead.source_url && (
                    <a
                      href={selectedLead.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <FileText className="w-4 h-4" /> View Original Job Post
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog (shadcn) */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this parsed lead? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}