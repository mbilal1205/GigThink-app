import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import Proposal from "@/lib/models/Proposal";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import PublicProposalView from "@/components/proposals/PublicProposalView";

export default async function PublicProposalPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  await connectToDatabase();
  const proposal = await Proposal.findOne({ shareId }).lean();
  if (!proposal) notFound();

  // Track view (increment views, add event) â€“ but only once per session? For now, simple increment.
  await Proposal.updateOne({ _id: proposal._id }, {
    $inc: { views: 1 },
    lastViewedAt: new Date(),
    $push: { events: { event: "opened", timestamp: new Date() } }
  });

  // Fetch agency profile for branding (from Supabase using the proposal's userId)
  const supabase = await createSupabaseServerClient();
  const { data: agencyProfile } = await supabase
    .from("agency_profiles")
    .select("*")
    .eq("user_id", proposal.userId)
    .maybeSingle();

  // Check if user is premium from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, subscription_plan")
    .eq("id", proposal.userId)
    .single();

  const isPremium = profile?.is_premium || profile?.subscription_plan !== "free_trial";

  return (
    <PublicProposalView
      proposal={JSON.parse(JSON.stringify(proposal))}
      agencyProfile={agencyProfile}
      isPremium={isPremium}
    />
  );
}