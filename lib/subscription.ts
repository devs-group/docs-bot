import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { FREE_PLAN, PRO_PLAN, SubscriptionPlan } from "@/config/subscriptions";

export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  try {
    // Get the user's active subscription
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gte(subscriptions.stripeCurrentPeriodEnd, new Date())
        )
      );

    // If no active subscription is found, return the free plan
    if (!userSubscription.length) {
      return FREE_PLAN;
    }

    // Return the pro plan if the user has an active subscription
    return PRO_PLAN;
  } catch (error) {
    console.error("Error getting user subscription plan:", error);
    return FREE_PLAN; // Default to free plan on error
  }
}

export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false;
  
  return (
    subscription.status === "active" &&
    new Date(subscription.stripeCurrentPeriodEnd) > new Date()
  );
}
