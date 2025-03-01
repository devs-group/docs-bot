"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CreditCard, Zap } from "lucide-react";
import { format } from "date-fns";
import { FREE_PLAN, PRO_PLAN } from "@/config/subscriptions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SubscriptionInfoProps {
  subscription?: any;
}

export function SubscriptionInfo({ subscription }: SubscriptionInfoProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine the current plan
  const isSubscribed = subscription?.status === "active" && 
    new Date(subscription?.stripeCurrentPeriodEnd) > new Date();
  
  const currentPlan = isSubscribed ? PRO_PLAN : FREE_PLAN;
  
  // Format the renewal date
  const renewalDate = subscription?.stripeCurrentPeriodEnd
    ? format(new Date(subscription.stripeCurrentPeriodEnd), "MMMM d, yyyy")
    : null;
  
  const onManageSubscription = async () => {
    try {
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };
  
  const onUpgrade = async () => {
    try {
      setIsLoading(true);
      
      // Create a checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: PRO_PLAN.stripePriceId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      toast.error(error.message || "Failed to upgrade plan");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Subscription</CardTitle>
          <Badge variant={isSubscribed ? "default" : "outline"} className="text-xs">
            {isSubscribed ? "Active" : "Free"}
          </Badge>
        </div>
        <CardDescription>
          {isSubscribed
            ? "You are currently on the Pro plan"
            : "You are currently on the Free plan"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{currentPlan.name} Plan</p>
            <p className="text-xs text-muted-foreground">
              {currentPlan.price === 0
                ? "Free forever"
                : `$${currentPlan.price}/month`}
            </p>
          </div>
        </div>
        
        {isSubscribed && renewalDate && (
          <div className="flex items-center gap-4">
            <CalendarClock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Next Billing Date</p>
              <p className="text-xs text-muted-foreground">{renewalDate}</p>
            </div>
          </div>
        )}
        
        <div className="rounded-md bg-muted p-3">
          <div className="text-sm font-medium">Plan Features</div>
          <ul className="mt-2 grid gap-1 text-xs">
            {currentPlan.features.slice(0, 4).map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        {isSubscribed ? (
          <Button
            className="w-full"
            variant="outline"
            onClick={onManageSubscription}
            disabled={isLoading}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Manage Subscription"}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={onUpgrade}
            disabled={isLoading}
          >
            <Zap className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Upgrade to Pro"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
