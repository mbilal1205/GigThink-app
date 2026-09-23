"use client";

import { useState } from "react";
import { MapPin, DollarSign, Clock, Briefcase, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ApplyButton from "@/components/opportunities/ApplyButton";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote_type: string;
    salary_min?: number;
    salary_max?: number;
    match_score?: number;
    match_reasons?: string[];
    apply_url: string;
    posted_at: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const salaryDisplay =
    job.salary_min && job.salary_max
      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
      : "Salary not specified";

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="group rounded-xl border border-white/10 bg-card/70 backdrop-blur-sm p-5 space-y-3 transition-all hover:bg-card/80 hover:border-primary/30 hover:shadow-lg card-hover">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
            {job.company?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {job.company}
            </p>
          </div>
        </div>
        {job.match_score !== undefined && (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-xs font-medium",
              job.match_score >= 75
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
            )}
          >
            {job.match_score}% Match
          </Badge>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          {salaryDisplay}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary/70" />
          {job.remote_type === 'remote' ? 'Remote' : job.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {timeAgo(job.posted_at)}
        </span>
      </div>

      {/* Match reasons */}
      {job.match_reasons && job.match_reasons.length > 0 && (
        <div className="text-xs space-y-1">
          {job.match_reasons.slice(0, 2).map((reason, idx) => (
            <p key={idx} className="text-muted-foreground">âœ“ {reason}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Briefcase className="h-4 w-4 mr-1" />
          Details
        </Button>
        <ApplyButton
          jobId={job.id}
          jobTitle={job.title}
          jobCompany={job.company}
          variant="default"
          size="sm"
          className="flex-1 h-9 text-xs btn-gradient"
        />
      </div>

      {/* External link */}
      <a
        href={job.apply_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" /> View original posting
      </a>
    </div>
  );
}