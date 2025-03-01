export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  stripePriceId: string;
  price: number;
  features: string[];
  limits: {
    models: string[];
    messageCredits: number;
    charactersPerAgent: number;
    agents: number;
    links: number | "unlimited";
    websites: number | "unlimited";
  };
};

export const FREE_PLAN: SubscriptionPlan = {
  id: "free",
  name: "Free",
  description: "For personal use",
  stripePriceId: "", // No price ID for free plan
  price: 0,
  features: [
    "Access to fast models",
    "100 message credits/month",
    "400,000 characters/agent",
    "1 agent",
    "Limit of 10 links to train on",
    "Embed on unlimited websites",
  ],
  limits: {
    models: ["fast"],
    messageCredits: 100,
    charactersPerAgent: 400000,
    agents: 1,
    links: 10,
    websites: "unlimited",
  },
};

export const PRO_PLAN: SubscriptionPlan = {
  id: "pro",
  name: "Pro",
  description: "For professionals",
  stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_1QxwrFItE6bS9BLxhIJ4xgVn", // TODO: fix the env here.
  price: 40,
  features: [
    "Everything in Free +",
    "Access to advanced models",
    "2,000 message credits/month",
    "1 agent",
    "11,000,000 characters/agent",
    "Unlimited links to train on",
  ],
  limits: {
    models: ["fast", "advanced"],
    messageCredits: 2000,
    charactersPerAgent: 11000000,
    agents: 1,
    links: "unlimited",
    websites: "unlimited",
  },
};

export const SUBSCRIPTION_PLANS = [FREE_PLAN, PRO_PLAN];
