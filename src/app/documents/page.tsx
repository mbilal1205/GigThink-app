"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Inbox, FileText, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ui/confirm-delete-dialog";
import DocumentCard from "@/components/documents/DocumentCard";

interface Resume {
  id: string;
  title: string;
  content: string;
  job_id?: string;
  created_at: string;
  updated_at: string;
}

interface CoverLetter {
  id: string;
  content: string;
  job_id: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "resume" | "cover"; id: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumesRes, coverLettersRes] = await Promise.all([
        fetch("/api/resumes"),
        fetch("/api/cover-letters"),
      ]);
      const resumesData = await resumesRes.json();
      const coverLettersData = await coverLettersRes.json();

      if (!resumesRes.ok) throw new Error(resumesData.error || "Failed to load resumes");
      if (!coverLettersRes.ok) throw new Error(coverLettersData.error || "Failed to load cover letters");

      setResumes(resumesData.resumes || []);
      setCoverLetters(coverLettersData.coverLetters || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeleteDialog = (type: "resume" | "cover", id: string) => {
    setDeleteTarget({ type, id });
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const endpoint =
      deleteTarget.type === "resume"
        ? `/api/resumes/${deleteTarget.id}`
        : `/api/cover-letters/${deleteTarget.id}`;

    const res = await fetch(endpoint, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");

    // Custom success toast (dialog already shows generic "Action completed" after this resolves)
    toast.success(`${deleteTarget.type === "resume" ? "Resume" : "Cover letter"} deleted`);
    fetchData();
    setDeleteOpen(false);
    setDeleteTarget(null);
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
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center rounded-full bg-red-500/10 p-4 mb-4">
          <Loader2 className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold heading-gradient">ðŸ“„ My Documents</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your generated resumes and cover letters.
        </p>
      </div>

      {/* Resumes Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Resumes
          </h2>
          <span className="text-xs text-muted-foreground">{resumes.length} items</span>
        </div>

        {resumes.length === 0 ? (
          <Card className="border border-dashed border-white/10 bg-card/50 py-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No resumes generated yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <DocumentCard
                key={resume.id}
                type="resume"
                id={resume.id}
                title={resume.title}
                content={resume.content}
                updatedAt={resume.updated_at}
                onDelete={() => openDeleteDialog("resume", resume.id)}
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cover Letters Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Cover Letters
          </h2>
          <span className="text-xs text-muted-foreground">{coverLetters.length} items</span>
        </div>

        {coverLetters.length === 0 ? (
          <Card className="border border-dashed border-white/10 bg-card/50 py-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No cover letters generated yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverLetters.map((coverLetter) => (
              <DocumentCard
                key={coverLetter.id}
                type="cover"
                id={coverLetter.id}
                title={`Cover Letter (Job ID: ${coverLetter.job_id.slice(0, 8)}...)`}
                content={coverLetter.content}
                updatedAt={coverLetter.updated_at}
                onDelete={() => openDeleteDialog("cover", coverLetter.id)}
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}
      </section>

      {/* Professional Confirmation Dialog */}
      <ConfirmActionDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.type === "resume" ? "Delete Resume?" : "Delete Cover Letter?"}
        description="This action cannot be undone. This will permanently remove the document."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        icon={<FileText className="w-5 h-5 text-red-500" />}
      />
    </div>
  );
}