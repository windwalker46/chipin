import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    appInfo: { name: "ChipIn", version: "0.1.0" },
  });

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}
