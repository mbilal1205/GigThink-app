import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Proposal from "@/lib/models/Proposal";
import Task from "@/lib/models/Task";
import { ProjectHealthCard } from "@/components/projects/ProjectHealthCard";
import { DailyBriefingCard } from "@/components/projects/DailyBriefingCard";
import { WorkflowTimeline } from "@/components/projects/WorkflowTimeline";
import { ProjectChatPanel } from "@/components/chat/ProjectChatPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  FileText,
  User,
  Clock,
  DollarSign,
  Layers,
  CheckCircle2,
  ArrowLeft,
  BarChart3,
  Activity,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  await connectToDatabase();

  const projectDoc = await Project.findOne({ _id: id, userId: user.id }).lean();
  if (!projectDoc) notFound();

  const proposalDoc = await Proposal.findOne({ projectId: id, userId: user.id }).lean();

  const taskCount = await Task.countDocuments({ projectId: id, userId: user.id });
  const hasTasks = taskCount > 0;

  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .ilike("client_name", `%${projectDoc.clientName || ""}%`)
    .maybeSingle();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Completed</Badge>;
      case "in progress":
      case "in_progress":
      case "review":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">In Progress</Badge>;
      case "on hold":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">On Hold</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getSectionContent = (type: string) => {
    if (!proposalDoc?.sections) return "";
    const section = proposalDoc.sections.find((s: any) => s.type === type);
    return section?.content || "";
  };

  const executiveSummary = getSectionContent("executive-summary");
  const technicalArchitecture = getSectionContent("technical-architecture");

  const techKeywords = technicalArchitecture
    ? [
        "Next.js", "React", "Node.js", "Express", "MongoDB", "TypeScript",
        "Tailwind CSS", "PostgreSQL", "Supabase", "AWS", "Vercel", "Firebase",
        "Python", "Django", "Flask", "Laravel", "PHP", "Vue.js", "Angular",
        "React Native", "Flutter", "Swift", "Kotlin", "Shopify", "WordPress",
        "Webflow", "Stripe", "PayPal", "REST API", "GraphQL",
      ].filter((tech) => technicalArchitecture.toLowerCase().includes(tech.toLowerCase()))
    : [];

  const totalBudget = proposalDoc?.metadata?.totalBudget || 0;
  const currency = proposalDoc?.metadata?.currency || "USD";

  const progress = projectDoc.progress ?? 0;
  const healthScore = projectDoc.healthScore ?? 100;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* â”€â”€â”€ Header â”€â”€â”€ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <span className="text-xs text-muted-foreground">â€¢</span>
            <span className="text-xs text-muted-foreground font-mono">ID: {id}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight heading-gradient">
            {projectDoc.title || "Enterprise Project Workspace"}
          </h1>
          <div className="overflow-x-auto">
            <WorkflowTimeline
              status={projectDoc.status}
              proposalStatus={proposalDoc?.status}
              hasTasks={hasTasks}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href={`/projects/${id}/proposal`}>
            <Button className="btn-gradient text-white font-semibold gap-2 shadow-sm">
              <Sparkles className="h-4 w-4 fill-white/20" />
              View / Edit Proposal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* â”€â”€â”€ Overview Cards â”€â”€â”€ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {projectDoc.clientName || clientData?.client_name || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {clientData?.company_name || "Direct Client"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {getStatusBadge(projectDoc.status || "Draft")}
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-extrabold text-emerald-400">
              {currency} {totalBudget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>{progress}%</span>
              <span className="text-muted-foreground">Health: {healthScore}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€â”€ Health & Briefing â”€â”€â”€ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProjectHealthCard projectId={String(id)} />
        <DailyBriefingCard projectId={String(id)} />
      </div>

      {/* â”€â”€â”€ Proposal Summary â”€â”€â”€ */}
      <div className="bg-card border border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 heading-gradient">
            <FileText className="h-5 w-5 text-primary" /> Proposal Summary
          </h2>
          {proposalDoc ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Generated
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">No Proposal Yet</Badge>
          )}
        </div>

        {proposalDoc ? (
          <div className="space-y-4">
            {executiveSummary && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Executive Summary
                </h3>
                <p className="text-sm mt-1 leading-relaxed text-muted-foreground line-clamp-3">
                  {executiveSummary}
                </p>
              </div>
            )}

            {techKeywords.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {techKeywords.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs text-muted-foreground">
                Status: {proposalDoc.status}
              </span>
              <Link
                href={`/projects/${id}/proposal`}
                className="text-xs text-primary hover:underline"
              >
                Open Full Proposal â†’
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">
              No proposal generated yet for this project.
            </p>
            <Link href={`/projects/${id}/proposal`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Generate Proposal Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}