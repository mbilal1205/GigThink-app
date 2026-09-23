import { consumeCredits, isPremiumUser } from "@/lib/credits";

const ACTION_COST_MAP: Record<string, { actionType: string; cost: number }> = {
  search: { actionType: "lead_search", cost: 20 },
  proposal: { actionType: "full_proposal", cost: 30 },
  analyze: { actionType: "ai_analyze", cost: 10 },
  pitch: { actionType: "short_pitch", cost: 5 },
  workflow: { actionType: "full_workflow", cost: 50 },
};

export async function verifyUserLimits(userId: string, action: string) {
  const mapping = ACTION_COST_MAP[action];

  if (!mapping) {
    return { allowed: true, reason: "", showPaywall: false };
  }

  // ðŸ”¥ 1. Premium User Check
  const premium = await isPremiumUser(userId);

  if (premium) {
    console.log(
      `[CREDITS] âœ… Premium user bypass: ${userId} | action: ${action}`
    );
    return { allowed: true, reason: "premium", showPaywall: false };
  }

  // ðŸ”¥ 2. Normal User Credit Consumption
  const result = await consumeCredits(userId, mapping.actionType, mapping.cost);

  if (result.success) {
    return { allowed: true, reason: "", showPaywall: false };
  }

  return {
    allowed: false,
    reason: result.error || "Insufficient credits",
    showPaywall: result.showPaywall || false,
  };
}

export async function incrementUserUsage(userId: string, action: string) {
  // No-op: consumption already handled in verifyUserLimits
  return;
}