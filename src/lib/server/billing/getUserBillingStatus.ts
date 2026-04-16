import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type UserBillingStatus = {
  planId: "free" | "creator" | "pro";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  lifetimeAnalysesUsed: number;
  purchasedCredits: number;
  monthlyCreditsUsed: number;
  /** 만료 후 적용될 예약 플랜 ID. 없으면 null. */
  pendingPlanId: string | null;
};

// 6개월 플랜을 베이스 플랜으로 매핑
const PLAN_ID_TO_BASE: Record<string, "creator" | "pro"> = {
  creator: "creator",
  creator_6m: "creator",
  pro: "pro",
  pro_6m: "pro",
};

// 플랜 ID → 구독 기간(월) 매핑
const PLAN_PERIOD_MONTHS: Record<string, number> = {
  creator: 1,
  pro: 1,
  creator_6m: 6,
  pro_6m: 6,
};

export async function getUserBillingStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBillingStatus> {
  const [subRes, creditsRes] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("plan_id, subscription_status, renewal_at, pending_plan_id")
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
    renewal_at: string | null;
    pending_plan_id: string | null;
  } | null;

  const credits = creditsRes.data as {
    credits_used: number | null;
    lifetime_analyses_used: number | null;
    purchased_credits: number | null;
  } | null;

  const periodEnd = sub?.renewal_at ?? null;
  const isExpired = !periodEnd || new Date(periodEnd).getTime() < Date.now();
  const pendingPlanIdRaw =
    typeof sub?.pending_plan_id === "string" ? sub.pending_plan_id.trim() : null;

  let activePlanIdRaw = typeof sub?.plan_id === "string" ? sub.plan_id.trim() : "";
  let activePeriodEnd = periodEnd;
  let activePendingPlanId = pendingPlanIdRaw;
  let activeSubscriptionStatus =
    typeof sub?.subscription_status === "string"
      ? sub.subscription_status.trim().toLowerCase()
      : null;

  // ─── 만료된 구독에 예약 플랜이 있으면 자동 승격 (1회 실행 보장) ────────────
  if (isExpired && pendingPlanIdRaw) {
    const months = PLAN_PERIOD_MONTHS[pendingPlanIdRaw] ?? 1;
    const baseDate = periodEnd ? new Date(periodEnd) : new Date();
    const newRenewalAt = new Date(baseDate);
    newRenewalAt.setMonth(newRenewalAt.getMonth() + months);
    const newRenewalAtIso = newRenewalAt.toISOString();

    // pending_plan_id 조건을 함께 걸어 중복 실행 방지
    const { error: applyError } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        plan_id: pendingPlanIdRaw,
        pending_plan_id: null,
        renewal_at: newRenewalAtIso,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("pending_plan_id", pendingPlanIdRaw);

    if (!applyError) {
      activePlanIdRaw = pendingPlanIdRaw;
      activePeriodEnd = newRenewalAtIso;
      activePendingPlanId = null;
      activeSubscriptionStatus = "active";
    }
    // applyError 시 다른 요청이 이미 승격한 것으로 간주, 원래 값으로 진행
  }

  const basePlanId = PLAN_ID_TO_BASE[activePlanIdRaw] ?? null;
  const activeIsExpired =
    !activePeriodEnd || new Date(activePeriodEnd).getTime() < Date.now();
  const planId: "free" | "creator" | "pro" =
    !activeIsExpired && basePlanId ? basePlanId : "free";

  return {
    planId,
    subscriptionStatus: activeSubscriptionStatus,
    currentPeriodEnd: activePeriodEnd,
    lifetimeAnalysesUsed: credits?.lifetime_analyses_used ?? 0,
    purchasedCredits: credits?.purchased_credits ?? 0,
    monthlyCreditsUsed: credits?.credits_used ?? 0,
    pendingPlanId: activePendingPlanId,
  };
}
