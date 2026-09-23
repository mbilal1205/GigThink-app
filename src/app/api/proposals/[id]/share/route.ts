import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Proposal from "@/lib/models/Proposal";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const shareId = uuidv4(); // generate unique ID
  const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/proposal/view/${shareId}`;

  const updated = await Proposal.findOneAndUpdate(
    { _id: id, userId: user.id },
    {
      shareId,
      shareLink,
      sharedAt: new Date(),
      $push: { events: { event: "shared", timestamp: new Date() } },
      status: "sent", // Auto-update status to sent
    },
    { new: true }
  );
  if (!updated) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  return NextResponse.json({ success: true, shareLink });
}