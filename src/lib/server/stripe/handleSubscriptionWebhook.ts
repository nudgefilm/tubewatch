/**
 * Handles Stripe subscription lifecycle in webhook: checkout.session.completed (subscription),
 * customer.subscription.updated, customer.subscription.deleted.
 * Idempotent: upsert by user_id (checkout) or update by stripe_subscription_id (updated/deleted).
 */

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const VALID_PLAN_IDS = ["creator", "pro"] as const;
type PlanId = (typeof VALID_PLAN_IDS)[number];

function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && VALID_PLAN_IDS.includes(value as PlanId);
}

function toTimestamp(unix: number | null | undefined): string | null {
  if (unix == null || typeof unix !== "number") return null;
  const d = new Date(unix * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type SubscriptionWebhookResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * On checkout.session.completed when product_type === "subscription":
 * upsert user_subscriptions by user_id with data from session + subscription.
 */
export async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<SubscriptionWebhookResult> {
  const metadata = session.metadata ?? {};
  const productType = metadata.product_type;
  if (productType !== "subscription") {
    return { ok: true };
  }

  const userIdRaw = metadata.user_id;
  const planIdRaw = metadata.plan_id;
  if (typeof userIdRaw !== "string" || userIdRaw.trim() === "") {
    return { ok: false, error: "Missing or invalid metadata.user_id" };
  }
  if (!isPlanId(planIdRaw)) {
    return { ok: false, error: "Missing or invalid metadata.plan_id" };
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionIdRaw = session.subscription;
  if (!subscriptionIdRaw) {
    return { ok: false, error: "Missing session.subscription" };
  }
  const subscriptionId =
    typeof subscriptionIdRaw === "string"
      ? subscriptionIdRaw
      : subscriptionIdRaw.id;

  let status: string;
  let currentPeriodEnd: string | null = null;
  if (typeof subscriptionIdRaw === "object" && subscriptionIdRaw !== null) {
    const sub = subscriptionIdRaw as Stripe.Subscription & {
      current_period_end?: number;
    };
    status = sub.status ?? "active";
    currentPeriodEnd = toTimestamp(sub.current_period_end);
  } else {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    status = subscription.status;
    const subWithPeriod = subscription as { current_period_end?: number };
    currentPeriodEnd = toTimestamp(subWithPeriod.current_period_end);
  }

  const now = new Date().toISOString();
  const row = {
    user_id: userIdRaw.trim(),
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscriptionId,
    plan_id: planIdRaw,
    subscription_status: status,
    current_period_end: currentPeriodEnd,
    updated_at: now,
  };

  const { error: upsertError } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert(row, {
      onConflict: "user_id",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }
  return { ok: true };
}

/**
 * On customer.subscription.updated: update row by stripe_subscription_id.
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<SubscriptionWebhookResult> {
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const subWithPeriod = subscription as { current_period_end?: number };
  const currentPeriodEnd = toTimestamp(subWithPeriod.current_period_end);

  const updates: {
    subscription_status: string;
    current_period_end: string | null;
    updated_at: string;
  } = {
    subscription_status: status,
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update(updates)
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * On customer.subscription.deleted: set status (and optionally period) by stripe_subscription_id.
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<SubscriptionWebhookResult> {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const updates = {
    subscription_status: status,
    current_period_end: toTimestamp(
      (subscription as { current_period_end?: number }).current_period_end
    ),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update(updates)
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
