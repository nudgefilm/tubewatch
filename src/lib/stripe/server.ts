/**
 * Server-only Stripe utilities. Do not import from client components.
 */
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function getStripeSecretKey(): string {
  if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.trim() === "") {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return STRIPE_SECRET_KEY;
}

/**
 * Server-only Stripe instance. Use in API routes or server actions.
 * Do not import this module from client components.
 */
export function getStripe(): Stripe {
  return new Stripe(getStripeSecretKey(), {
    typescript: true,
  });
}
