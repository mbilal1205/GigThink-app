import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";
import mongoose from "mongoose";

// â”€â”€â”€ Types â”€â”€â”€
export interface ProjectHealth {
  score: number;
  status: "healthy" | "at_risk" | "critical";
  progress: number;
  expectedProgress: number;
  delayDays: number;
  overdueTasks: number;
  blockedTasks: number;
  totalTasks: number;
  completedTasks: number;
  estimatedHours: number;
  actualHours: number;
  message: string;
}

export interface RiskAlert {
  type: "overdue" | "blocked" | "high_priority_delay" | "dependency";
  severity: "low" | "medium" | "high";
  message: string;
  taskId?: string;
  taskTitle?: string;
}

export interface DailyBriefing {
  date: string;
  projectId: string;
  projectTitle: string;
  message: string;
  topTasks: Array<{ taskId: string; title: string; estimatedHours: number; priority: string; dueDate?: string }>;
  warnings: string[];
}

// â”€â”€â”€ Helper: Fetch project & tasks securely â”€â”€â”€
async function getProjectAndTasks(userId: string, projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("Invalid project ID");
  }

  await connectToDatabase();

  const project = await Project.findOne({ _id: projectId, userId }).lean();
  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  const tasks = await Task.find({ projectId, userId })
    .sort({ order: 1, dueDate: 1 })
    .lean();

  return { project, tasks };
}

// â”€â”€â”€ 1. Calculate Project Health â”€â”€â”€
export async function calculateProjectHealth(userId: string, projectId: string): Promise<ProjectHealth> {
  const { project, tasks } = await getProjectAndTasks(userId, projectId);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Expected progress based on elapsed time
  const now = new Date();
  const startDate = new Date(project.createdAt || now);
  const deadline = project.deadline ? new Date(project.deadline) : null;
  let expectedProgress = 0;
  let delayDays = 0;

  if (deadline && deadline > startDate) {
    const totalDuration = deadline.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const remainingMs = deadline.getTime() - now.getTime();
    if (remainingMs < 0) {
      delayDays = Math.ceil(Math.abs(remainingMs) / (1000 * 60 * 60 * 24));
    }
  } else if (deadline && deadline <= startDate) {
    expectedProgress = 100;
  }

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now
  ).length;

  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

  // Health score calculation
  let score = 100;
  score -= Math.max(0, (expectedProgress - progress) * 0.5); // behind schedule penalty
  score -= overdueTasks * 5; // each overdue task reduces score
  score -= blockedTasks * 3; // blocked tasks reduce score
  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: ProjectHealth["status"] = "healthy";
  if (score >= 70 && progress >= expectedProgress - 10) status = "healthy";
  else if (score >= 40) status = "at_risk";
  else status = "critical";

  const estimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const actualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  const message =
    status === "healthy"
      ? "Project on track. Keep up the good work!"
      : status === "at_risk"
      ? "Project is falling behind. Review priorities and adjust schedule."
      : "Project is critically behind. Immediate action required.";

  return {
    score,
    status,
    progress,
    expectedProgress,
    delayDays,
    overdueTasks,
    blockedTasks,
    totalTasks,
    completedTasks,
    estimatedHours,
    actualHours,
    message,
  };
}

// â”€â”€â”€ 2. Detect Delays â”€â”€â”€
export async function detectDelays(userId: string, projectId: string): Promise<RiskAlert[]> {
  const { project, tasks } = await getProjectAndTasks(userId, projectId);
  const alerts: RiskAlert[] = [];
  const now = new Date();

  // Overdue tasks
  const overdue = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now
  );
  for (const task of overdue) {
    alerts.push({
      type: "overdue",
      severity: "high",
      message: `Task "${task.title}" is overdue by ${Math.ceil(
        (now.getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      )} day(s)`,
      taskId: task._id.toString(),
      taskTitle: task.title,
    });
  }

  // Blocked tasks
  const blocked = tasks.filter((t) => t.status === "blocked");
  for (const task of blocked) {
    alerts.push({
      type: "blocked",
      severity: "medium",
      message: `Task "${task.title}" is blocked. Clear dependencies to proceed.`,
      taskId: task._id.toString(),
      taskTitle: task.title,
    });
  }

  // High priority tasks near due date but not started
  const highPriority = tasks.filter(
    (t) =>
      t.priority === "high" &&
      t.status === "pending" &&
      t.dueDate &&
      new Date(t.dueDate).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 &&
      new Date(t.dueDate) > now
  );
  for (const task of highPriority) {
    alerts.push({
      type: "high_priority_delay",
      severity: "medium",
      message: `High priority task "${task.title}" due soon. Consider starting it now.`,
      taskId: task._id.toString(),
      taskTitle: task.title,
    });
  }

  // Dependency chain issues: tasks whose dependencies are not completed
  const incompleteDeps = tasks.filter((t) =>
    t.dependencies.some((depId:any) => {
      const dep = tasks.find((d) => d._id.toString() === depId.toString());
      return dep && dep.status !== "completed";
    })
  );
  for (const task of incompleteDeps) {
    alerts.push({
      type: "dependency",
      severity: "low",
      message: `Task "${task.title}" is waiting on incomplete dependencies.`,
      taskId: task._id.toString(),
      taskTitle: task.title,
    });
  }

  return alerts;
}

// â”€â”€â”€ 3. Generate Daily Briefing (AI) â”€â”€â”€
export async function generateDailyBriefing(
  userId: string,
  projectId: string,
  forceRegenerate = false
): Promise<DailyBriefing> {
  const { project, tasks } = await getProjectAndTasks(userId, projectId);

  // Get current health for context
  const health = await calculateProjectHealth(userId, projectId);

  // Build AI prompt
  const systemInstruction = `
You are the Daily Project Manager for GigThink.
Generate a concise, motivating morning briefing for the user.
Use the project data provided.
Output should be plain text (not JSON).
Include:
- Summary of project status (health)
- Top 3 priorities for today
- Any warnings or risks
- Encouragement and action items

Be professional, friendly, and direct.
`;

  const taskSummary = tasks
    .slice(0, 10)
    .map(
      (t) =>
        `- ${t.title} | status: ${t.status} | priority: ${t.priority} | est: ${t.estimatedHours}h | due: ${
          t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A"
        }`
    )
    .join("\n");

  const userPrompt = `
Project: ${project.title}
Client: ${project.clientName || "Unknown"}
Health: score ${health.score}/100 (${health.status})
Progress: ${health.progress}% (expected ${health.expectedProgress}%)
Overdue tasks: ${health.overdueTasks}
Blocked tasks: ${health.blockedTasks}
Total tasks: ${health.totalTasks}

Tasks:
${taskSummary}

Generate today's briefing for the user.
`;

  let message = "";
  try {
    message = await generateAIResponse({
      userId,
      prompt: userPrompt,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction,
    });
  } catch (error) {
    console.error("[DAILY_BRIEFING_AI_ERROR]", error);
    message = `Good morning! You have ${health.totalTasks - health.completedTasks} open tasks. Focus on priorities and resolve any blockers.`;
  }

  // Identify top tasks (simple heuristic: incomplete, sorted by priority and due date)
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
  const incomplete = tasks.filter((t) => t.status !== "completed");
  incomplete.sort((a, b) => {
    const diff =
      (priorityWeight[b.priority as keyof typeof priorityWeight] || 1) -
      (priorityWeight[a.priority as keyof typeof priorityWeight] || 1);
    if (diff !== 0) return diff;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.order - b.order;
  });

  const topTasks = incomplete.slice(0, 3).map((t) => ({
    taskId: t._id.toString(),
    title: t.title,
    estimatedHours: t.estimatedHours || 0,
    priority: t.priority,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
  }));

  const warnings: string[] = [];
  if (health.overdueTasks > 0) warnings.push(`${health.overdueTasks} task(s) are overdue.`);
  if (health.blockedTasks > 0) warnings.push(`${health.blockedTasks} task(s) are blocked.`);
  if (health.delayDays > 0) warnings.push(`Project is ${health.delayDays} day(s) past deadline.`);

  return {
    date: new Date().toISOString().split("T")[0],
    projectId,
    projectTitle: project.title,
    message,
    topTasks,
    warnings,
  };
}

// â”€â”€â”€ 4. Update project healthScore in DB â”€â”€â”€
export async function updateProjectHealth(userId: string, projectId: string): Promise<void> {
  const health = await calculateProjectHealth(userId, projectId);
  await Project.updateOne(
    { _id: projectId, userId },
    { $set: { healthScore: health.score, progress: health.progress } }
  );
}