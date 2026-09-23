import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Proposal from "@/lib/models/Proposal";

export async function POST(req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await params;
    const { action } = await req.json();

    // 1. Database se connect karein (Mongoose context ready karein)
    await connectToDatabase();

    // 2. Update object define karein type-safe tareeqe se
    const update: any = {
      $push: { 
        events: { event: action, timestamp: new Date() } 
      },
    };

    // 3. Agar client koi decision leta hai tou status aur tracking fields update karein
    if (action === "accepted" || action === "rejected" || action === "changes_requested") {
      update.clientAction = action;
      update.actionAt = new Date();
      
      // Agar changes requested hain tou status 'review' ya 'draft' mein rakh sakte hain, warna accepted/rejected
      if (action === "accepted") {
        update.status = "accepted";
      } else if (action === "rejected") {
        update.status = "rejected";
      } else if (action === "changes_requested") {
        update.status = "review"; // Changes ke liye wapis review status
      }
    }

    // 4. Proposal ko shareId ke through update karein
    const result = await Proposal.updateOne({ shareId }, update);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("ðŸš¨ Update Share Action Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
