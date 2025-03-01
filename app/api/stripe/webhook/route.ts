import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        // Retrieve the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        const userId = session.client_reference_id;
        const stripeCustomerId = session.customer as string;
        
        // Update user with Stripe customer ID if not already set
        if (userId) {
          await db
            .update(users)
            .set({ stripeCustomerId })
            .where(eq(users.id, userId));
          
          // Create or update subscription record
          const subscriptionData = {
            userId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripeCustomerId,
            planId: 'pro', // Assuming this is for the pro plan
            status: subscription.status,
            updatedAt: new Date(),
          };
          
          // Check if subscription already exists
          const existingSubscription = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
          
          if (existingSubscription.length > 0) {
            // Update existing subscription
            await db
              .update(subscriptions)
              .set(subscriptionData)
              .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
          } else {
            // Create new subscription
            await db.insert(subscriptions).values(subscriptionData);
          }
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        
        // Retrieve the subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update the subscription end date
        await db
          .update(subscriptions)
          .set({
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        
        await db
          .update(subscriptions)
          .set({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Update subscription status to canceled
        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
