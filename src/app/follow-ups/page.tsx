"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SequencesTab } from "@/components/follow-ups/SequencesTab";
import { AssignmentsTab } from "@/components/follow-ups/AssignmentsTab";
import { LogsTab } from "@/components/follow-ups/LogsTab";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { SequenceFormModal } from "@/components/follow-ups/SequenceFormModal";
import { AssignSequenceModal } from "@/components/follow-ups/AssignSequenceModal";
import { toast } from "sonner";

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState("sequences");
  const [sequences, setSequences] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sequenceModalOpen, setSequenceModalOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seqRes, assignRes, logsRes] = await Promise.all([
        fetch("/api/follow-ups/sequences"),
        fetch("/api/follow-ups/assignments"),
        fetch("/api/follow-ups/logs"),
      ]);
      if (seqRes.ok) {
        const data = await seqRes.json();
        setSequences(data.sequences || []);
      }
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      toast.error("Failed to load follow-up data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSequence = () => {
    setEditingSequence(null);
    setSequenceModalOpen(true);
  };

  const handleEditSequence = (sequence: any) => {
    setEditingSequence(sequence);
    setSequenceModalOpen(true);
  };

  const handleAssign = () => {
    setAssignModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 bg-transparent text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold heading-gradient">Auto Followâ€‘ups</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create personalized follow-up sequences and automatically nurture your leads.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="text-xs">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={handleCreateSequence} className="btn-gradient text-xs">
            <Plus className="h-4 w-4 mr-1" /> New Sequence
          </Button>
          <Button size="sm" variant="secondary" onClick={handleAssign} className="text-xs">
            <Plus className="h-4 w-4 mr-1" /> Assign
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sequences" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-lg p-1">
          <TabsTrigger value="sequences" className="text-xs">Sequences</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs">Active Assignments</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Logs & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="mt-4">
          <SequencesTab
            sequences={sequences}
            loading={loading}
            onEdit={handleEditSequence}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <AssignmentsTab
            assignments={assignments}
            loading={loading}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <LogsTab logs={logs} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SequenceFormModal
        open={sequenceModalOpen}
        onClose={() => setSequenceModalOpen(false)}
        sequence={editingSequence}
        onSaved={fetchData}
      />
      <AssignSequenceModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        sequences={sequences}
        onAssigned={fetchData}
      />
    </div>
  );
}