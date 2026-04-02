import type { SupabaseClient } from "@supabase/supabase-js";

export type UserBillingStatus = {
  planId: "free" | "creator" | "pro";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  lifetimeAnalysesUsed: number;
  purchasedCredits: number;
  monthlyCreditsUsed: number;
};

export async function getUserBillingStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBillingStatus> {
  const [subRes, creditsRes] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("plan_id, subscription_status, current_period_end")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_credits")
      .select("credits_used, lifetime_analyses_used, purchased_credits")
      .eq("user_id", userId)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const sub = subRes.data as {
    plan_id: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
  } | null;

  const credits = creditsRes.data as {
    credits_used: number | null;
    lifetime_analyses_used: number | null;
    purchased_credits: number | null;
  } | null;

  const status =
    typeof sub?.subscription_status === "string"
      ? sub.subscription_status.trim().toLowerCase()
      : null;
  const isActive = status === "active" || status === "trialing";
  const planIdRaw =
    typeof sub?.plan_id === "string" ? sub.plan_id.trim() : "";
  const planId: "free" | "creator" | "pro" =
    isActive && (planIdRaw === "creator" || planIdRaw === "pro")
      ? planIdRaw
      : "free";

  return {
    planId,
    subscriptionStatus: sub?.subscription_status ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    lifetimeAnalysesUsed: credits?.lifetime_analyses_used ?? 0,
    purchasedCredits: credits?.purchased_credits ?? 0,
    monthlyCreditsUsed: credits?.credits_used ?? 0,
  };
}
