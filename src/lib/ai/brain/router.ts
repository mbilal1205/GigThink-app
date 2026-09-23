// src/lib/ai/brain/router.ts
import { BrainContext } from "./context-builder";
import * as Tools from "./tools/index";
import PendingAction from "@/lib/models/PendingAction";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

type ToolHandler = (userId: string, message: string, context: BrainContext) => Promise<string>;

const toolRegistry: Record<string, ToolHandler> = {
  // existing tools (jo aapke paas already hain)
  proposal: Tools.handleProposal,
  pricing: Tools.handlePricing,
  risk: Tools.handleRisk,
  analyzer: Tools.handleAnalyzer,
  planning: Tools.handlePlanning,
  negotiation: Tools.handleNegotiation,
  techarchitect: Tools.handleTechArchitect,
  timeestimator: Tools.handleTimeEstimator,
  interviewcoach: Tools.handleInterviewCoach,
  reviewer: Tools.handleReviewer,
  contract: Tools.handleContract,
  mentor: Tools.handleMentor,
  upsell: Tools.handleUpsell,
  qa: Tools.handleQA,
  delivery: Tools.handleDelivery,
  skillgap: Tools.handleSkillGap,
  scopegenerator: Tools.handleScopeGenerator,
  crm: Tools.handleCRM,
  businesscoach: Tools.handleBusinessCoach,
  healthmonitor: Tools.handleHealthMonitor,
  callprep: Tools.handleCallPrep,
  revision: Tools.handleRevisionAssistant,
  portfolio: Tools.handlePortfolioMatcher,
  learning: Tools.handleLearningCoach,
  deadline: Tools.handleDeadlineManager,
  chat: Tools.handleChat,
  // Phase 3 tools
  search_leads: Tools.handleSearchLeads,
  create_client: Tools.handleCreateClient,
  save_proposal: Tools.handleSaveProposal,
  draft_email: Tools.handleDraftEmail,
  create_task: Tools.handleCreateTask,
  // Phase 5 tools
  list_proposals: Tools.handleListProposals,
  delete_client: Tools.handleDeleteClient,
  search_opportunities: Tools.handleSearchOpportunities,
  schedule_followup: Tools.handleScheduleFollowup,
  // Phase 7 tools
  set_preference: Tools.handleSetPreference,
  get_preferences: Tools.handleGetPreferences,
};

const toolRiskMap: Record<string, "low" | "medium" | "high"> = {
  // low risk
  chat: "low",
  search_leads: "low",
  list_proposals: "low",
  search_opportunities: "low",
  get_preferences: "low",
  // medium risk
  save_proposal: "medium",
  create_task: "medium",
  schedule_followup: "medium",
  create_client: "medium",
  draft_email: "medium",
  set_preference: "medium",
  // high risk
  delete_client: "high",
};

export interface RouteResult {
  text: string;
  pendingAction?: any;
}

export async function routeIntent(
  userId: string,
  toolName: string,
  message: string,
  context: BrainContext
): Promise<RouteResult> {
  const key = toolName.toLowerCase().replace(/\s/g, "");
  const handler = toolRegistry[key] || toolRegistry["chat"];
  const risk = toolRiskMap[key] || "low";

  console.log(`[ROUTER] Tool: ${key}, Risk: ${risk}`);

  // Agar risk high hai, to pehle pending action banayein
  if (risk === "high") {
    const pendingAction = await createPendingAction(userId, key, { message });
    return {
      text: `âš ï¸ **Action Requires Confirmation**\n\nAap "${key}" kaam karna chahte hain. Kya aap confirm karte hain?`,
      pendingAction,
    };
  }

  // Low/medium risk: direct execute
  let responseText = await handler(userId, message, context);

  // AI Decision Engine (only for some tools)
  if (key !== "chat" && key !== "mentor" && key !== "learning" && key !== "get_preferences") {
    const decision = await generateDecision(context);
    responseText += `\n\n---\n**ðŸ§  AI Decision Engine:**\n${decision}`;
  }

  return { text: responseText };
}

async function createPendingAction(userId: string, actionType: string, actionPayload: any) {
  await connectToDatabase();
  const pending = new PendingAction({
    userId,
    actionType,
    actionPayload,
    status: "pending",
  });
  await pending.save();
  return {
    id: pending._id.toString(),
    actionType,
    actionPayload,
  };
}

// Helper to execute pending action after approval
export async function executePendingAction(userId: string, pendingActionId: string, approved: boolean): Promise<string> {
  await connectToDatabase();
  const pending = await PendingAction.findById(pendingActionId);
  if (!pending || pending.userId !== userId) {
    return "âŒ Pending action nahi mila ya expire ho gaya.";
  }
  if (pending.status !== "pending") {
    return "âŒ Ye action pehle se process ho chuka hai.";
  }

  if (!approved) {
    pending.status = "rejected";
    await pending.save();
    return "âŒ Action cancel kar diya gaya.";
  }

  // Approved, ab actual handler call karo
  const handler = toolRegistry[pending.actionType];
  if (!handler) {
    pending.status = "rejected";
    await pending.save();
    return "âŒ Unknown action type.";
  }

  // Context build karo (without session memory? hum fresh context use karenge)
  const { buildBrainContext } = await import("./context-builder");
  const context = await buildBrainContext(userId);

  // Handler ko call karo, payload message use karo
  const message = pending.actionPayload.message || "";
  const resultText = await handler(userId, message, context);

  pending.status = "approved";
  await pending.save();

  return resultText;
}

// Yeh function generateDecision ko define karta hai
async function generateDecision(context: BrainContext): Promise<string> {
  const p = context.currentProposal;
  const project = context.currentProject;
  let budget = p?.totalBudget || "Unknown";
  let timeline = p?.sections.find((s: any) => s.type === "project-timeline")?.content || "Unknown";
  
  return await generateAIResponse({
    userId: context.userId,
    prompt: `Based on this project: ${project?.title || "N/A"}, Budget: ${budget}, Timeline: ${timeline}. Generate a single-line GO/NO-GO decision with confidence score and next step.`,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Decision Engine. Output format: "Decision: GO/NO-GO â˜…â˜…â˜…â˜†â˜† | Risk: Low/Med/High | Next Step: ..." Keep it under 50 words.`,
  });
}