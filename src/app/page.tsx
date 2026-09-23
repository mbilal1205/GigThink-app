"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Users,
  FileText,
  Layers,
  Briefcase,
  TrendingUp,
  Activity,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
  Search,
  Plus,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  Globe,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OpportunityCard from "@/components/OpportunityCard";
import GlobalLeadCard from "@/components/leads/GlobalLeadCard";
import JobCard from "@/components/jobs/JobCard";
import { cn } from "@/lib/utils";

// â”€â”€â”€ Types â”€â”€â”€
interface Client {
  id: string;
  client_name: string;
  project_title: string;
  status: string;
  created_at: string;
}

interface Proposal {
  _id: string;
  title: string;
  status: string;
  clientName: string;
  totalBudget: number;
  currency: string;
  updatedAt: string;
  projectId?: string;
}

interface Project {
  _id: string;
  title: string;
  clientName: string;
  status: string;
  progress: number;
  healthScore: number;
  updatedAt: string;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  location: string;
  is_remote: boolean;
  job_type: string;
  skills: string[];
  posted_at: string;
  source_url: string;
  score: number;
  why_this: string[];
  client_quality: string;
  competition_estimate: string;
}

interface Lead {
  id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  niche: string | null;
  lead_temperature: string | null;
  rating: number | null;
  source: string;
  created_at: string;
  is_saved: boolean;
  raw_data?: any;
}

interface ScoredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remote_type: string;
  salary_min?: number;
  salary_max?: number;
  match_score: number;
  match_reasons: string[];
  apply_url: string;
  posted_at: string;
}

interface CandidateProfile {
  full_name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  experience_level?: string;
  preferred_roles?: string[];
  preferred_industries?: string[];
  desired_salary_min?: number;
  desired_salary_max?: number;
  preferred_locations?: string[];
  remote_preference?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientsCount, setClientsCount] = useState(0);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [careerJobs, setCareerJobs] = useState<ScoredJob[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        clientsRes,
        proposalsRes,
        projectsRes,
        feedRes,
        leadsFeedRes,
        careerFeedRes,
        applicationsRes,
        profileRes,
        resumesRes,
        coverLettersRes,
      ] = await Promise.all([
        fetch("/api/Clients"),
        fetch("/api/proposals?limit=5"),
        fetch("/api/projects"),
        fetch("/api/feed?limit=3"),
        fetch("/api/leads-feed?limit=3"),
        fetch("/api/career-feed?limit=3&sort=best_match"),
        fetch("/api/applications"),
        fetch("/api/candidate-profile"),
        fetch("/api/resumes"),
        fetch("/api/cover-letters"),
      ]);

      const [
        clientsData,
        proposalsData,
        projectsData,
        feedData,
        leadsFeedData,
        careerFeedData,
        applicationsData,
        profileData,
        resumesData,
        coverLettersData,
      ] = await Promise.all([
        clientsRes.json(),
        proposalsRes.json(),
        projectsRes.json(),
        feedRes.json(),
        leadsFeedRes.json(),
        careerFeedRes.json(),
        applicationsRes.json(),
        profileRes.json(),
        resumesRes.json(),
        coverLettersRes.json(),
      ]);

      if (clientsRes.ok && clientsData.clients) setClientsCount(clientsData.clients.length);
      if (proposalsRes.ok && proposalsData.proposals) {
        setProposalsCount(proposalsData.pagination?.total || proposalsData.proposals.length);
        setRecentProposals(proposalsData.proposals.slice(0, 3));
      }
      if (projectsRes.ok && projectsData.projects) {
        setProjectsCount(projectsData.projects.length);
        setRecentProjects(projectsData.projects.slice(0, 3));
      }
      if (feedRes.ok && feedData.opportunities) setOpportunities(feedData.opportunities.slice(0, 3));
      if (leadsFeedRes.ok && leadsFeedData.leads) setLeads(leadsFeedData.leads.slice(0, 3));
      if (careerFeedRes.ok && careerFeedData.jobs) setCareerJobs(careerFeedData.jobs.slice(0, 3));
      if (applicationsRes.ok && applicationsData.applications) {
        setApplicationsCount(applicationsData.applications.length);
      }
      if (profileRes.ok && profileData.profile) setCandidateProfile(profileData.profile);
      if (resumesRes.ok && resumesData.resumes) setDocumentsCount((prev) => prev + resumesData.resumes.length);
      if (coverLettersRes.ok && coverLettersData.coverLetters) {
        setDocumentsCount((prev) => prev + coverLettersData.coverLetters.length);
      }
    } catch (err) {
      console.error("[DASHBOARD_FETCH]", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFullWorkflowDemo = async () => {
    setWorkflowLoading(true);
    toast.info("ðŸš€ Starting AI Workflow Demo...");
    try {
      const demoOpp = {
        title: "Demo: Shopify Store Development",
        description: "Build a responsive Shopify store with payment integration and AI product recommendations.",
        clientName: "Demo Client",
        clientCompany: "Demo Corp",
        budgetMin: 2000,
        budgetMax: 3000,
        currency: "USD",
        skills: ["Shopify", "React", "Liquid"],
        source: "demo",
      };
      const res = await fetch("/api/workflow/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoOpp),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workflow failed");
      toast.success("âœ… Workflow completed! Opening project...");
      if (data.projectId) {
        router.push(`/projects/${data.projectId}`);
      } else {
        router.push("/projects/list");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorkflowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/70 backdrop-blur-sm p-8 sm:p-12 space-y-6"
      >
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> GigThink AI Operating System
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold heading-gradient tracking-tight leading-tight">
            Find the right work.<br />
            Win the client.<br />
            Execute the project.
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
            GigThink AI finds high-match opportunities, generates winning proposals,
            creates project plans, and monitors your execution â€” all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="btn-gradient text-white font-semibold gap-2 h-12"
              onClick={handleFullWorkflowDemo}
              disabled={workflowLoading}
            >
              {workflowLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {workflowLoading ? "Running Demo..." : "Start Full Workflow Demo"}
            </Button>
            <Link href="/feed">
              <Button size="lg" variant="outline" className="h-12 gap-2 border-white/10 bg-white/5 hover:bg-white/10">
                <Search className="h-5 w-5" />
                Browse Opportunities
              </Button>
            </Link>
            <Link href="/career-feed">
              <Button size="lg" variant="outline" className="h-12 gap-2 border-white/10 bg-white/5 hover:bg-white/10">
                <Briefcase className="h-5 w-5" />
                Career Feed
              </Button>
            </Link>
            <Link href="/leads-feed">
              <Button size="lg" variant="outline" className="h-12 gap-2 border-white/10 bg-white/5 hover:bg-white/10">
                <Flame className="h-5 w-5" />
                Browse Leads
              </Button>
            </Link>
            <Link href="/clients">
              <Button size="lg" variant="ghost" className="h-12 gap-2">
                <Plus className="h-5 w-5" />
                New Client
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Row (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Clients", value: clientsCount, icon: Users, color: "text-primary" },
          { label: "Proposals", value: proposalsCount, icon: FileText, color: "text-emerald-400" },
          { label: "Projects", value: projectsCount, icon: Layers, color: "text-purple-400" },
          { label: "Opportunities", value: opportunities.length + careerJobs.length, icon: Briefcase, color: "text-amber-400" },
          { label: "Applications", value: applicationsCount, icon: Mail, color: "text-blue-400" },
          { label: "Documents", value: documentsCount, icon: FileText, color: "text-pink-400" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx, duration: 0.4 }}
          >
            <Card className="border border-white/10 bg-card/70 backdrop-blur-sm hover:bg-card/80 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Candidate Profile Summary (if exists) */}
      {candidateProfile && (
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Your Career Profile
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {candidateProfile.headline || "Complete your profile for better matches"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {candidateProfile.summary && (
              <p className="text-xs text-muted-foreground">{candidateProfile.summary}</p>
            )}
            {candidateProfile.skills && candidateProfile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {candidateProfile.skills.slice(0, 10).map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {candidateProfile.experience_level && (
                <span>Experience: {candidateProfile.experience_level}</span>
              )}
              {candidateProfile.preferred_roles && candidateProfile.preferred_roles.length > 0 && (
                <span>Roles: {candidateProfile.preferred_roles.join(', ')}</span>
              )}
              {candidateProfile.remote_preference && (
                <span>Remote: {candidateProfile.remote_preference}</span>
              )}
            </div>
            <Link href="/candidate-profile" className="text-xs text-primary hover:underline inline-block mt-1">
              Edit Profile â†’
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Recent Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Quick Actions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Jump to key features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "AI Score an Opportunity", icon: Sparkles, href: "/feed", color: "text-primary" },
              { label: "Browse Leads Feed", icon: Flame, href: "/leads-feed", color: "text-orange-400" },
              { label: "Generate Proposal", icon: FileText, href: "/clients", color: "text-emerald-400" },
              { label: "Create Project", icon: Layers, href: "/projects/new", color: "text-purple-400" },
              { label: "Career Feed", icon: Briefcase, href: "/career-feed", color: "text-blue-400" },
              { label: "View Applications", icon: Mail, href: "/applications", color: "text-pink-400" },
            ].map((action, idx) => (
              <Link
                key={idx}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group"
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  {action.label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs font-semibold border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              onClick={handleFullWorkflowDemo}
              disabled={workflowLoading}
            >
              {workflowLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              Run Full Demo
            </Button>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Recent Projects
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Your active workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project._id}
                  href={`/projects/${project._id}`}
                  className="block p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate">{project.title}</p>
                    <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{project.clientName}</span>
                    <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">No projects yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Proposals */}
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent Proposals
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Latest client pitches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProposals.length > 0 ? (
              recentProposals.map((proposal) => (
                <Link
                  key={proposal._id}
                  href={`/projects/${proposal.projectId || proposal._id}/proposal`}
                  className="block p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate">{proposal.title}</p>
                    <Badge variant="outline" className="text-[10px]">{proposal.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{proposal.clientName}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {proposal.currency} {proposal.totalBudget?.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">No proposals yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Career Feed Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold heading-gradient flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> AI Career Feed (Top Matches)
          </h2>
          <Link href="/career-feed" className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {careerJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {careerJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-white/10 bg-card/50 py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No career feed data yet. Complete your profile and run ingestion.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/candidate-profile')}>
              Complete Profile
            </Button>
          </Card>
        )}
      </div>

      {/* Opportunity Feed Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold heading-gradient flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> Top Opportunities For You
          </h2>
          <Link href="/feed" className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-white/10 bg-card/50 py-12 text-center">
            <p className="text-muted-foreground text-sm">No opportunities found.</p>
          </Card>
        )}
      </div>

      {/* Leads Feed Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold heading-gradient flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" /> Latest Leads from Community
          </h2>
          <Link href="/leads-feed" className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {leads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <GlobalLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-white/10 bg-card/50 py-12 text-center">
            <p className="text-muted-foreground text-sm">No leads yet.</p>
          </Card>
        )}
      </div>

      {/* AI Monitor Promo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> AI Project Health
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Real-time monitoring of your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              GigThink AI continuously analyzes progress, deadlines, and risks to keep your projects on track.
            </p>
            <Link href="/projects/list" className="text-xs text-primary hover:underline mt-2 inline-block">
              Check Project Health â†’
            </Link>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> AI Daily Briefing
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Start your day with AI priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Get a personalized morning briefing with top tasks, risks, and recommended actions.
            </p>
            <Link href="/projects/list" className="text-xs text-primary hover:underline mt-2 inline-block">
              View Daily Briefing â†’
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}