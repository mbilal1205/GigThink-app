import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import mongoose from "mongoose";
import { z } from "zod";

interface PlanInput {
  userId: string;
  projectId: string;
  message: string;
  projectTitle: string;
  clientName?: string;
  existingTasksCount?: number;
}

interface CreatedTask {
  _id: string;
  title: string;
}

const aiTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  estimatedHours: z.number().min(0).max(1000).default(0),
  durationDays: z.number().int().positive().default(1),
  startOffsetDays: z.number().int().min(0).default(0),
  dependencies: z.array(z.number().int().min(0)).default([]),
});

const aiPlanSchema = z.object({
  tasks: z.array(aiTaskSchema).min(1).max(50),
  totalEstimatedHours: z.number().min(0).optional(),
  suggestedDeadline: z.string().nullable().optional(),
});

export async function generateProjectPlan({
  userId,
  projectId,
  message,
  projectTitle,
  clientName,
  existingTasksCount = 0,
}: PlanInput) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("Invalid project ID");
  }

  await connectToDatabase();

  const project = await Project.findOne({ _id: projectId, userId }).lean();
  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  const systemInstruction = `
You are an elite Project Planner AI for GigThink.
Your ONLY task is to output a VALID JSON object (NO markdown, NO explanations, NO trailing commas) with this exact structure:

{
  "tasks": [
    {
      "title": "string",
      "description": "string or empty string",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedHours": number,
      "durationDays": number,
      "startOffsetDays": number,
      "dependencies": [number, ...]
    }
  ],
  "totalEstimatedHours": number,
  "suggestedDeadline": "ISO date string or null"
}

Rules:
- Output ONLY the JSON object. No surrounding text.
- Use double quotes for all strings. No single quotes.
- Do NOT include trailing commas.
- Arrays: [0,1] not [0,1,]
- Ensure all numbers are valid (no strings for numbers).
- dependencies: indices (0-based) of tasks that must complete before this task starts. For tasks with no dependencies, use [].
- Tasks must be in logical order (index 0 = first task).
- Estimate realistic hours for a senior freelancer.
- Project already has ${existingTasksCount} tasks; generate only NEW tasks that logically follow, do not duplicate existing work.
- User request: "${message}"
`;

  const userPrompt = `Project: ${projectTitle}\nClient: ${clientName || "Unknown"}\nUser Request: ${message}`;

  // Helper function to extract JSON from AI response
  const extractJSON = (raw: string): any => {
    let cleaned = raw.trim();

    // Remove markdown code fences
    cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Remove any leading/trailing text outside JSON
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

    // Remove comments (just in case)
    cleaned = cleaned.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

    return JSON.parse(cleaned);
  };

  // First attempt
  let rawResponse: string;
  try {
    rawResponse = await generateAIResponse({
      userId,
      prompt: userPrompt,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction,
    });
  } catch (err) {
    console.error("[PLANNER] AI call failed:", err);
    throw new Error("AI planning service unavailable");
  }

  let parsed: any;
  try {
    parsed = extractJSON(rawResponse);
  } catch (firstError) {
    console.warn("[PLANNER] First parse failed, retrying with correction prompt...");
    // Retry once with explicit instruction to fix JSON
    const retryInstruction = `${systemInstruction}\n\nYour previous response was invalid JSON. Output ONLY the JSON object. Ensure no markdown, no trailing commas, valid array syntax.`;

    const retryResponse = await generateAIResponse({
      userId,
      prompt: `Fix the JSON and output only valid JSON:\n${userPrompt}`,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction: retryInstruction,
    });

    try {
      parsed = extractJSON(retryResponse);
    } catch (secondError) {
      console.error("[PLANNER] Retry parse failed:", secondError);
      throw new Error("AI returned invalid plan format after retry. Please try again with a clearer description.");
    }
  }

  // Validate with Zod
  const validation = aiPlanSchema.safeParse(parsed);
  if (!validation.success) {
    console.error("[PLANNER] Validation failed:", validation.error.format());
    throw new Error("AI plan validation failed. Structure not as expected.");
  }

  const { tasks: aiTasks } = validation.data;

  const projectStart = project.createdAt || new Date();
  const createdTasks: CreatedTask[] = [];

  for (let i = 0; i < aiTasks.length; i++) {
    const t = aiTasks[i];
    const depIndices = t.dependencies || [];
    const depObjectIds = depIndices
      .filter((idx) => idx >= 0 && idx < i)
      .map((idx) => createdTasks[idx]?._id)
      .filter(Boolean);

    const startDate = new Date(projectStart);
    startDate.setDate(startDate.getDate() + (t.startOffsetDays || 0));

    const due = new Date(startDate);
    due.setDate(due.getDate() + (t.durationDays || 1));

    const newTask = await Task.create({
      projectId,
      userId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      estimatedHours: t.estimatedHours,
      status: "pending",
      order: existingTasksCount + i + 1,
      dependencies: depObjectIds,
      startDate,
      dueDate: due,
    });

    createdTasks.push({
      _id: newTask._id.toString(),
      title: newTask.title,
    });
  }

  const totalNewHours = aiTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  await Project.updateOne(
    { _id: projectId, userId },
    {
      $inc: { estimatedHours: totalNewHours },
      $set: { updatedAt: new Date() },
    }
  );

  await recalculateProgress(projectId, userId);

  return {
    success: true,
    tasksCreated: createdTasks,
    totalTasks: aiTasks.length,
    totalHours: totalNewHours,
  };
}

async function recalculateProgress(projectId: string, userId: string) {
  const tasks = await Task.find({ projectId, userId }).select("status").lean();
  if (tasks.length === 0) {
    await Project.updateOne(
      { _id: projectId, userId },
      { $set: { progress: 0 } }
    );
    return;
  }
  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = Math.round((completed / tasks.length) * 100);
  await Project.updateOne(
    { _id: projectId, userId },
    { $set: { progress } }
  );
}