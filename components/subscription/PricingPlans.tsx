"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/config/subscriptions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PricingPlansProps {
  userId: string;
  userSubscription?: any;
}

export function PricingPlans({ userId, userSubscription }: PricingPlansProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const onSubscribe = async (plan: SubscriptionPlan) => {
    try {
      if (!userId) {
        return toast.error("You must be logged in to subscribe");
      }

      // If it's the free plan, we don't need to do anything
      if (plan.id === "free") {
        return toast.success("You are already on the free plan");
      }

      setIsLoading(plan.id);

      console.log(plan)

      // Create a checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast.error(error.message || "Failed to subscribe to plan");
    } finally {
      setIsLoading(null);
    }
  };

  const onManageSubscription = async () => {
    try {
      setIsLoading("manage");

      // Create a billing portal session
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create billing portal session");
      }

      // Redirect to Stripe billing portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error managing subscription:", error);
      toast.error(error.message || "Failed to manage subscription");
    } finally {
      setIsLoading(null);
    }
  };

  // Check if the user has an active subscription
  const hasActiveSubscription = userSubscription?.status === "active" && 
    new Date(userSubscription?.stripeCurrentPeriodEnd) > new Date();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
      {SUBSCRIPTION_PLANS.map((plan) => {
        // Check if this is the user's current plan
        const isCurrentPlan = hasActiveSubscription && userSubscription?.planId === plan.id;
        const isFree = plan.id === "free";

        return (
          <Card
            key={plan.id}
            className={`flex flex-col border-2 ${
              isCurrentPlan ? "border-primary" : "border-border"
            }`}
          >
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid flex-1 gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-sm text-muted-foreground">per month</span>
              </div>

              <ul className="grid gap-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isCurrentPlan ? (
                <Button
                  className="w-full"
                  onClick={onManageSubscription}
                  disabled={isLoading === "manage"}
                >
                  {isLoading === "manage" ? "Loading..." : "Manage Subscription"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isFree ? "outline" : "default"}
                  onClick={() => onSubscribe(plan)}
                  disabled={!!isLoading || (isFree && !hasActiveSubscription)}
                >
                  {isLoading === plan.id
                    ? "Loading..."
                    : isFree
                    ? "Current Plan"
                    : "Subscribe"}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
