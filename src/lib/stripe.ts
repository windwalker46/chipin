import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();

function isPlaceholderKey(key: string) {
  const normalized = key.trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes("replace_with") ||
    normalized.includes("placeholder") ||
    normalized.includes("replace_")
  );
}

export function hasUsableStripeSecretKey() {
  return /^sk_(test|live)_/i.test(env.STRIPE_SECRET_KEY) && !isPlaceholderKey(env.STRIPE_SECRET_KEY);
}

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    appInfo: { name: "ChipIn", version: "0.1.0" },
  });

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}
