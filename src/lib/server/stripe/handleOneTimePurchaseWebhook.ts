/**
 * Handles checkout.session.completed where product_type === "credit".
 * Adds purchased_credits to the user's user_credits row.
 */
import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addPurchasedCredits } from "@/lib/server/analysis/checkUserCredits";

export type OneTimePurchaseWebhookResult =
  | { ok: true }
  | { ok: false; error: string };

export async function handleOneTimePurchaseCompleted(
  session: Stripe.Checkout.Session
): Promise<OneTimePurchaseWebhookResult> {
  const metadata = session.metadata ?? {};
  if (metadata.product_type !== "credit") return { ok: true };

  const userId = typeof metadata.user_id === "string" ? metadata.user_id.trim() : "";
  if (!userId) return { ok: false, error: "Missing metadata.user_id" };

  const creditCountRaw = parseInt(metadata.credit_count ?? "", 10);
  if (isNaN(creditCountRaw) || creditCountRaw <= 0) {
    return { ok: false, error: "Invalid metadata.credit_count" };
  }

  try {
    await addPurchasedCredits(supabaseAdmin, userId, creditCountRaw);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
