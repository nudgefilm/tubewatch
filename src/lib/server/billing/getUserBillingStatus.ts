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
      .select("plan_id, status")
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
    status: string | null;
  } | null;

  const credits = creditsRes.data as {
    credits_used: number | null;
    lifetime_analyses_used: number | null;
    purchased_credits: number | null;
  } | null;

  const status =
    typeof sub?.status === "string"
      ? sub.status.trim().toLowerCase()
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
    subscriptionStatus: sub?.status ?? null,
    currentPeriodEnd: null,
    lifetimeAnalysesUsed: credits?.lifetime_analyses_used ?? 0,
    purchasedCredits: credits?.purchased_credits ?? 0,
    monthlyCreditsUsed: credits?.credits_used ?? 0,
  };
}
