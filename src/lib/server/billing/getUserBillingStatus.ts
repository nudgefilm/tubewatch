import type { SupabaseClient } from "@supabase/supabase-js";

export type UserBillingStatus = {
  planId: "free" | "creator" | "pro";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  lifetimeAnalysesUsed: number;
  purchasedCredits: number;
  monthlyCreditsUsed: number;
};

// 6개월 플랜을 베이스 플랜으로 매핑
const PLAN_ID_TO_BASE: Record<string, "creator" | "pro"> = {
  creator: "creator",
  creator_6m: "creator",
  pro: "pro",
  pro_6m: "pro",
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

  // current_period_end 기준 만료 여부 — subscription_status 값과 무관하게 판단
  const periodEnd = sub?.current_period_end ?? null;
  const isExpired = !periodEnd || new Date(periodEnd).getTime() < Date.now();

  const planIdRaw = typeof sub?.plan_id === "string" ? sub.plan_id.trim() : "";
  const basePlanId = PLAN_ID_TO_BASE[planIdRaw] ?? null;
  const planId: "free" | "creator" | "pro" =
    !isExpired && basePlanId ? basePlanId : "free";

  return {
    planId,
    subscriptionStatus: status,
    currentPeriodEnd: periodEnd,
    lifetimeAnalysesUsed: credits?.lifetime_analyses_used ?? 0,
    purchasedCredits: credits?.purchased_credits ?? 0,
    monthlyCreditsUsed: credits?.credits_used ?? 0,
  };
}
