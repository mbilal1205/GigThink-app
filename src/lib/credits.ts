import { createSupabaseServerClient } from "@/utils/supabase/server";

export interface ConsumeResult {
  success: boolean;
  creditsAfter: number;
  error?: string;
  showPaywall?: boolean;
}

export async function consumeCredits(
  userId: string,
  actionType: string,
  cost: number
): Promise<ConsumeResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_credits", {
    p_user_id: userId,
    p_action_type: actionType,
    p_cost: cost,
  });

  if (error) {
    console.error("[CREDITS_RPC_ERROR]", error);
    return { success: false, creditsAfter: 0, error: "Failed to process credits" };
  }

  // ðŸ”¥ Supabase RPC returns array of rows when function returns table
  const result = Array.isArray(data) && data.length > 0 ? data[0] : null;

  if (!result) {
    return { success: false, creditsAfter: 0, error: "Invalid credits response" };
  }

  if (!result.success) {
    return {
      success: false,
      creditsAfter: result.credits_after || 0,
      error: result.error || "Insufficient credits",
      showPaywall: true,
    };
  }

  return { success: true, creditsAfter: result.credits_after };
}

export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[CREDITS_BALANCE_ERROR]", error);
    return 0;
  }
  return data?.credits_remaining ?? 0;
}

export async function isPremiumUser(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "is_premium, subscription_plan, subscription_status, subscription_end_date"
    )
    .eq("id", userId)
    .single();

  if (error || !data) return false;

  const activePaidPlan =
    data.subscription_status === "active" &&
    data.subscription_plan !== "free_trial" &&
    data.subscription_plan !== "free";

  return (
    data.is_premium === true ||
    activePaidPlan ||
    (data.subscription_status === "active" &&
      data.subscription_end_date &&
      new Date(data.subscription_end_date) > new Date())
  );
}