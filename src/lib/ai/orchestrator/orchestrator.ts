import { callProviderModel } from "../provider-router";
import type { ChatMessage } from "../types";
import { detectIntent } from "./intent";
import { getRelevantKnowledge } from "../knowledge/selector";
import {
  verifyUserLimits,
  incrementUserUsage,
} from "../../../app/api/guards/check-limits";

// ════════════════════════════════════════════
// 🏗️ TYPE DEFINITIONS
// ════════════════════════════════════════════

export interface AIRequestParams {
  userId: string;
  prompt: string;
  systemInstruction?: string;
  model?: string;
  isProposal?: boolean;
  isSectionGeneration?: boolean;
  history?: ChatMessage[];
}

export type { ChatMessage };

// ════════════════════════════════════════════
// 🎯 GENERATION MODE ENUM
// ════════════════════════════════════════════

type GenerationMode = "full_proposal" | "section" | "chat";

interface GenerationConfig {
  mode: GenerationMode;
  temperature: number;
  maxTokens: number;
  shouldSearchWeb: boolean;
  shouldWrapJSON: boolean;
  modelChain: string[];
}

// ════════════════════════════════════════════
// ⚡ PROFESSIONAL JSON PROPOSAL INSTRUCTION
// ════════════════════════════════════════════

const PROPOSAL_JSON_INSTRUCTION = `
You are GigThink AI, an elite proposal architect. You generate ONLY valid JSON objects.

Generate a professional, client-ready proposal in the following JSON structure:
{
  "clientName": "string",
  "company": "string",
  "coverLetterBody": "string (warm, personalized letter with Dear [Name], body, closing)",
  "summary": "string",
  "problem": "string",
  "solution": "string",
  "technical": "string",
  "milestones": [{"week": "string", "task": "string"}],
  "pricingTotal": "string (e.g. PKR 40,000)",
  "pricingBreakdown": [{"item": "string", "cost": "string"}],
  "terms": ["string array of terms"],
  "decision": "string (GO / NO_GO)",
  "risk": "string (High / Medium / Low)",
  "nextStep": "string"
}

IMPORTANT RULES:
- Do NOT ask questions. Write the complete proposal immediately.
- Use the knowledge base and market insights provided to make it accurate.
- Output ONLY the JSON object. No markdown, no XML, no extra text.
- Ensure the cover letter is personalized and convincing.
- All prices should be in PKR if the client is from Pakistan, otherwise USD.
- Always include realistic milestones, pricing, and terms.
`.trim();

// ════════════════════════════════════════════
// 🛠️ UTILITY FUNCTIONS
// ════════════════════════════════════════════

function determineGenerationMode(params: AIRequestParams): GenerationMode {
  const { isProposal, isSectionGeneration, prompt } = params;
  const cleanPrompt = prompt.toLowerCase();

  if (isProposal && isSectionGeneration) return "section";

  if (
    isProposal ||
    cleanPrompt.includes("proposal") ||
    cleanPrompt.includes("write job post")
  ) {
    return "full_proposal";
  }

  return "chat";
}

function getGenerationConfig(mode: GenerationMode): GenerationConfig {
  switch (mode) {
    case "full_proposal":
      return {
        mode: "full_proposal",
        temperature: 0.35,
        maxTokens: 4096,
        shouldSearchWeb: true,
        shouldWrapJSON: true,
        modelChain: getModelChain("proposal"),
      };

    case "section":
      return {
        mode: "section",
        temperature: 0.5,
        maxTokens: 2048,
        shouldSearchWeb: false,
        shouldWrapJSON: false,
        modelChain: getModelChain("proposal"),
      };

    case "chat":
      return {
        mode: "chat",
        temperature: 0.7,
        maxTokens: 2048,
        shouldSearchWeb: false,
        shouldWrapJSON: false,
        modelChain: getModelChain("chat"),
      };

    default:
      return {
        mode: "chat",
        temperature: 0.7,
        maxTokens: 2048,
        shouldSearchWeb: false,
        shouldWrapJSON: false,
        modelChain: getModelChain("chat"),
      };
  }
}

// src/lib/ai/orchestrator/orchestrator.ts

function getModelChain(type: "proposal" | "chat"): string[] {
  const mode = process.env.AI_PROVIDER_MODE || "production";
  
  // 🔥 TESTING MODE: Sirf Groq use karo
  if (mode === "testing") {
    const groqChain = type === "proposal" 
      ? process.env.GROQ_PROPOSAL_CHAIN 
      : process.env.GROQ_CHAT_CHAIN;
    
    if (groqChain) {
      const models = groqChain.split(",").map(m => m.trim()).filter(Boolean);
      console.log(`[ORCHESTRATOR] 🧪 TESTING MODE: Using Groq only: ${models.join(", ")}`);
      return models;
    }
    
    // Fallback Groq models
    const fallback = type === "proposal" 
      ? ["openai/gpt-oss-20b"] 
      : ["llama-3.1-8b-instant"];
    console.log(`[ORCHESTRATOR] 🧪 TESTING MODE: Using Groq fallback: ${fallback.join(", ")}`);
    return fallback;
  }
  
  // 🔥 PRODUCTION MODE: Full multi-provider chain
  console.log(`[ORCHESTRATOR] 🚀 PRODUCTION MODE: Full provider chain`);
  
  // Provider chains (priority order)
  const chains = {
    openrouter: type === "proposal" 
      ? process.env.OPENROUTER_PROPOSAL_CHAIN 
      : process.env.OPENROUTER_CHAT_CHAIN,
    deepseek: type === "proposal" 
      ? process.env.DEEPSEEK_PROPOSAL_CHAIN 
      : process.env.DEEPSEEK_CHAT_CHAIN,
    google: type === "proposal" 
      ? process.env.GOOGLE_PROPOSAL_CHAIN 
      : process.env.GOOGLE_CHAT_CHAIN,
    groq: type === "proposal" 
      ? process.env.GROQ_PROPOSAL_CHAIN 
      : process.env.GROQ_CHAT_CHAIN,
  };
  
  // Priority order: OpenRouter (free) → DeepSeek (free) → Google (free) → Groq (paid fallback)
  const priorityOrder = ["openrouter", "deepseek", "google", "groq"];
  
  let allModels: string[] = [];
  
  for (const provider of priorityOrder) {
    const chainStr = chains[provider as keyof typeof chains];
    if (chainStr) {
      const models = chainStr.split(",").map(m => m.trim()).filter(Boolean);
      allModels = [...allModels, ...models];
    }
  }
  
  // Ultimate fallback (Groq)
  if (allModels.length === 0) {
    const fallback = type === "proposal" 
      ? ["openai/gpt-oss-20b"] 
      : ["llama-3.1-8b-instant"];
    allModels = fallback;
  }
  
  console.log(`[ORCHESTRATOR] 🚀 Production chain: ${allModels.join(" → ")}`);
  return allModels;
}

function getActionType(mode: GenerationMode): "proposal" | "search" {
  return mode === "chat" ? "search" : "proposal";
}

// ════════════════════════════════════════════
// 🌐 WEB SEARCH TOOLS
// ════════════════════════════════════════════

async function fetchTavilyContext(query: string): Promise<string> {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return "";

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 3,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return "";

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return "";

    return results
      .map(
        (res: any) =>
          `📌 ${res.title}\n${res.content?.substring(0, 300) || "No content"}\n🔗 ${res.url || ""}\n---`
      )
      .join("\n");
  } catch {
    return "";
  }
}

async function fetchSerperContext(query: string): Promise<string> {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return "";

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 3 }),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return "";

    const data = await response.json();
    const organic = data.organic || [];

    if (organic.length === 0) return "";

    return organic
      .map((res: any) => `🔍 ${res.title}\n${res.snippet || ""}\n---`)
      .join("\n");
  } catch {
    return "";
  }
}

// ════════════════════════════════════════════
// 🧹 RESPONSE SANITIZERS
// ════════════════════════════════════════════

function sanitizeSectionResponse(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/```[\w]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/\*\*Section \d+:\*\*/gi, "")
    .replace(/^#+\s.*$/gm, "")
    .trim();
}

function extractProposalJSON(text: string): string {
  let cleaned = text.replace(/```(json)?/gi, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  JSON.parse(cleaned);
  return cleaned;
}

function cleanCodeBlocks(text: string): string {
  return text.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
}

// ════════════════════════════════════════════
// 🎯 PROMPT BUILDER
// ════════════════════════════════════════════

function buildEnhancedPrompt(
  prompt: string,
  knowledgeContext: string,
  webContext: string,
  mode: GenerationMode
): string {
  const sections: string[] = [];

  if (knowledgeContext) {
    sections.push(`📚 [GIGTHINK KNOWLEDGE BASE]:\n${knowledgeContext}`);
  }

  if (webContext && mode === "full_proposal") {
    sections.push(`🌐 [LIVE MARKET INSIGHTS]:\n${webContext}`);
  }

  if (mode === "section") {
    sections.push(
      `⚠️ [IMPORTANT INSTRUCTION]: Generate ONLY the requested section. Do NOT include other proposal sections. Do NOT use XML tags. Output clean professional text only.`
    );
  }

  sections.push(`📋 [CLIENT TASK]:\n${prompt}`);
  return sections.join("\n\n");
}

// ════════════════════════════════════════════
// 🚀 MAIN ORCHESTRATOR
// ════════════════════════════════════════════

export async function generateAIResponse(
  params: AIRequestParams
): Promise<string> {
  const { userId, prompt, systemInstruction, history } = params;

  // Phase 0: Mode & Config
  const mode = determineGenerationMode(params);
  const config = getGenerationConfig(mode);
  const actionType = getActionType(mode);

  console.log(`[ORCHESTRATOR]: Mode: ${mode} | Action: ${actionType}`);

  // Phase 1: Intent & Knowledge
  const intent = detectIntent(prompt);
  const knowledgeContext = getRelevantKnowledge(intent);

  // Phase 2: Security Guard
  const limitStatus = await verifyUserLimits(userId, actionType);

  if (!limitStatus.allowed) {
    throw new Error(
      `LIMIT_RESTRICTION: ${limitStatus.reason || "Monthly usage limit reached."}`
    );
  }

  // Phase 3: Dynamic Knowledge Injection
  let dynamicWebContext = "";

  if (config.shouldSearchWeb && mode === "full_proposal") {
    dynamicWebContext = await fetchTavilyContext(
      `${prompt} industry trends challenges 2026`
    );
  } else if (
    prompt.toLowerCase().includes("live") ||
    prompt.toLowerCase().includes("market rate")
  ) {
    dynamicWebContext = await fetchSerperContext(prompt);
  }

  // Phase 4: Build Enhanced Prompt
  const enhancedPrompt = buildEnhancedPrompt(
    prompt,
    knowledgeContext,
    dynamicWebContext,
    mode
  );

  // Phase 5: Prepare System Message
  let finalSystemInstruction =
    systemInstruction ||
    "You are GigThink AI, an elite AI Engineer and Proposal Architect.";

  if (mode === "full_proposal") {
    finalSystemInstruction = systemInstruction
      ? `${systemInstruction}\n\n${PROPOSAL_JSON_INSTRUCTION}`
      : PROPOSAL_JSON_INSTRUCTION;
  }

  const messagesPayload: ChatMessage[] = [
    { role: "system", content: finalSystemInstruction },
    ...(history || []),
    { role: "user", content: enhancedPrompt },
  ];

  // Phase 6: Resilient Model Chain
  const errors: string[] = [];

  for (const currentModelId of config.modelChain) {
    try {
      console.log(`[ORCHESTRATOR]: Trying model: ${currentModelId}`);

      const result = await callProviderModel(
        currentModelId,
        messagesPayload,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        }
      );

      let responseText = result.text || "";

      if (
        process.env.DEBUG_AI_REASONING === "true" &&
        result.reasoning
      ) {
        console.log(
          `[ORCHESTRATOR]: 🧠 Reasoning tokens (${currentModelId}) length: ${result.reasoning.length}`
        );
      }

      if (!responseText) {
        errors.push(`${currentModelId}: Empty response`);
        continue;
      }

      responseText = cleanCodeBlocks(responseText);

      if (mode === "section") {
        responseText = sanitizeSectionResponse(responseText);

        if (
          responseText.toLowerCase().includes("executive summary") &&
          responseText.toLowerCase().includes("problem statement") &&
          responseText.toLowerCase().includes("solution")
        ) {
          errors.push(
            `${currentModelId}: Returned full proposal instead of section`
          );
          continue;
        }
      } else if (mode === "full_proposal") {
        try {
          responseText = extractProposalJSON(responseText);
        } catch {
          errors.push(`${currentModelId}: Invalid JSON output`);
          continue;
        }
      }

      if (responseText && responseText.length > 50) {
        await incrementUserUsage(userId, actionType);

        console.log(
          `[ORCHESTRATOR]: ✅ Success with ${currentModelId} | Provider: ${result.provider} | Length: ${responseText.length} chars`
        );

        return responseText;
      } else {
        errors.push(`${currentModelId}: Response too short`);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      console.error(`[ORCHESTRATOR]: ❌ ${currentModelId} failed: ${errorMsg}`);
      errors.push(`${currentModelId}: ${errorMsg}`);
      continue;
    }
  }

  const errorSummary = errors.join(" | ");
  console.error(`[ORCHESTRATOR]: 💀 All models failed. Errors: ${errorSummary}`);

  throw new Error(
    `[TERMINAL_FAULT]: All AI models failed to generate response. Please try again later.`
  );
}

export type { GenerationMode, GenerationConfig };