import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createBillingPortalSession } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to access the billing portal" },
        { status: 401 }
      );
    }
    
    // Get user's Stripe customer ID
    const user = (await db.select().from(users).where(eq(users.id, session.user.id)))[0];
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found for this user" },
        { status: 404 }
      );
    }
    
    // Create billing portal session
    const billingPortalSession = await createBillingPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${req.headers.get("origin") || process.env.NEXTAUTH_URL}/profile`,
    });
    
    return NextResponse.json({ url: billingPortalSession.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
