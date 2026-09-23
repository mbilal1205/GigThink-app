import { NextResponse } from "next/server";
import { Paddle, EventName, SubscriptionNotification } from "@paddle/paddle-node-sdk";
import { createClient } from "@supabase/supabase-js";

// 🔥 FIX: Supabase Admin ko strict backend settings ke sath initialize kiya hai
// Is se RLS (Row Level Security) bypass ho jayegi aur permission denied ka error hal ho jayega
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature") || "";
  
  // Raw body ko read karein
  const rawBody = await request.text();

  try {
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Secret key ko trim kar ke verify karein taake spaces error na dein
    const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim() || "";
    
    const event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    
    if (!event) {
      return NextResponse.json({ error: "Invalid webhook signature verification" }, { status: 400 });
    }

    // Paddle SDK dono types accept karta hai, safe side ke liye string check lagate hain
    const eventType = event.eventType as string;
    console.log(`🔔 Webhook Received: ${eventType}`);

    // 2. Handle Subscription Created or Updated Events
    if (
      eventType === EventName.SubscriptionCreated || 
      eventType === EventName.SubscriptionUpdated ||
      eventType === "subscription.created" || 
      eventType === "subscription.updated"
    ) {
      const subscription = event.data as SubscriptionNotification;
      
      const userId = subscription.customData?.userId;
      const customerId = subscription.customerId;
      const subscriptionId = subscription.id;
      const status = subscription.status; 
      const endDate = subscription.currentBillingPeriod?.endsAt;

      if (!userId) {
        console.error("❌ User ID not found in custom data.");
        return NextResponse.json({ error: "No UserID linked" }, { status: 400 });
      }

      // UPDATE SUPABASE PROFILES TABLE
      const { error: dbError } = await supabaseAdmin
        .from("profiles")
        .update({
          paddle_customer_id: customerId,
          paddle_subscription_id: subscriptionId,
          subscription_plan: "pro",
          subscription_status: status,
          subscription_end_date: endDate,
        })
        .eq("id", userId);

      if (dbError) {
        console.error("❌ Database Update Error: ", dbError.message);
        return NextResponse.json({ error: "Database Sync Failed" }, { status: 500 });
      }

      console.log(`✅ User ${userId} successfully updated to Pro plan.`);
    }

    // 3. Handle Subscription Cancellation
    if (eventType === EventName.SubscriptionCanceled || eventType === "subscription.canceled") {
      const subscription = event.data as SubscriptionNotification;
      const userId = subscription.customData?.userId;

      if (userId) {
        const { error: cancelError } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_plan: "free"
          })
          .eq("id", userId);

        if (cancelError) {
          console.error("❌ Cancellation DB Error: ", cancelError.message);
          return NextResponse.json({ error: "Cancellation Sync Failed" }, { status: 500 });
        }
          
        console.log(`❌ Subscription canceled for user ${userId}`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("💥 Webhook Execution Error: ", err.message);
    return NextResponse.json({ error: "Webhook Handler Error", details: err.message }, { status: 500 });
  }
}
