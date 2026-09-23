"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowTimelineProps {
  status: "Draft" | "In Progress" | "Completed";
  proposalStatus?: string;
  hasTasks?: boolean;
}

export function WorkflowTimeline({
  status,
  proposalStatus,
  hasTasks,
}: WorkflowTimelineProps) {
  const steps = [
    { label: "Opportunity Selected", completed: true },
    { label: "Proposal Generated", completed: proposalStatus ? true : false },
    { label: "Client Won", completed: status === "In Progress" || status === "Completed" },
    { label: "Tasks Ready", completed: hasTasks || false },
    { label: "Monitoring", completed: status === "In Progress" && hasTasks },
  ];

  let currentStep = 0;
  if (proposalStatus) currentStep = 1;
  if (status === "In Progress") currentStep = 2;
  if (hasTasks) currentStep = 3;
  if (status === "Completed") currentStep = 4;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-1.5">
            {step.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : index === currentStep ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs",
                step.completed
                  ? "text-emerald-400 font-medium"
                  : index === currentStep
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-8 sm:w-12 mx-2",
                steps[index + 1].completed ? "bg-emerald-500/50" : "bg-white/10"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}