import { MasterKnowledge } from "./knowledge";

/**
 * ⚡ Ultra-Fast Safe Knowledge Selector with Token Trimming
 */
export const getRelevantKnowledge = (intent: any): string => {
  let context = "";

  try {
    // 1. Industry Context
    if (intent?.industryId && MasterKnowledge.industries?.[intent.industryId as keyof typeof MasterKnowledge.industries]) {
      const indData = JSON.stringify(MasterKnowledge.industries[intent.industryId as keyof typeof MasterKnowledge.industries]);
      context += `[INDUSTRY_DATA]: ${indData.slice(0, 800)}\n\n`;
    }

    // 2. Sales & Communication Strategy
    if (intent?.category === "proposal" || intent?.category === "communication") {
      const salesStr = JSON.stringify(MasterKnowledge.sales || {});
      const commStr = JSON.stringify(MasterKnowledge.communication || {});
      context += `[SALES_FRAMEWORK]: ${salesStr.slice(0, 600)}\n`;
      context += `[COMMUNICATION_GUIDELINES]: ${commStr.slice(0, 600)}\n`;
    }

    // 3. Tech Context
    if (intent?.category === "tech") {
      context += `[TECH_STACK_EXPERT]: Modular Next.js 15, TypeScript, Supabase, MongoDB, Tailwind architecture.\n`;
    }
  } catch (err) {
    console.warn("[KNOWLEDGE_SELECTOR_ERROR]:", err);
  }

  return context.trim();
};