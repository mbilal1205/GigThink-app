import supabaseAdmin from "@/utils/supabaseAdmin";

type InteractionType =
  | "viewed"
  | "saved"
  | "contacted"
  | "proposal_generated"
  | "email_sent"
  | "added_to_pipeline"
  | "dismissed"
  | "clicked";

export async function recordInteraction(
  userId: string,
  leadId: string,
  action: InteractionType
) {
  const updateFields: any = {
    [action]: true,
    updated_at: new Date().toISOString(),
  };

  if (action === "viewed") updateFields.last_viewed_at = new Date().toISOString();
  if (action === "saved") updateFields.last_saved_at = new Date().toISOString();
  if (action === "contacted") updateFields.last_contacted_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("lead_user_interactions")
    .upsert(
      {
        user_id: userId,
        lead_id: leadId,
        ...updateFields,
      },
      { onConflict: "user_id,lead_id" }
    );

  if (error) {
    console.error("[INTERACTION_ERROR]", error);
    throw error;
  }
}