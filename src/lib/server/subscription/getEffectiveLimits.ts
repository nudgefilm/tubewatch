/**
 * 구독 기반 실제 사용 한도 계산.
 * user_subscriptions + BILLING_PLANS 기준. Admin 예외는 호출부에서 처리.
 * 유효 구독: active, trialing, manual + 만료 익일 이내.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillingPlanId,
  BILLING_PLANS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
} from "@/components/billing/types";

// refunded는 의도적으로 제외 — 환불된 구독은 만료일까지 조회만 허용, 분석 차단
const VALID_SUBSCRIPTION_STATUSES = ["active", "trialing", "manual"] as const;
const FREE_CHANNEL_LIMIT = 1;

// 6개월 플랜 → 베이스 플랜 매핑 (한도는 동일, plan_id만 다름)
const PLAN_ID_TO_BASE: Record<string, Extract<BillingPlanId, "creator" | "pro">> = {
  creator: "creator",
  creator_6m: "creator",
  pro: "pro",
  pro_6m: "pro",
};

export type EffectivePlanId = BillingPlanId | "free";

export type EffectiveLimitsResult = {
  planId: EffectivePlanId;
  subscriptionStatus: string | null;
  channelLimit: number;
  monthlyAnalysisLimit: number;
};

/**
 * 일반 사용자 기준 한도 계산. Admin 여부는 호출부에서 판단.
 */
export async function getEffectiveLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<EffectiveLimitsResult> {
  const { data: row, error } = await supabase
    .from("user_subscriptions")
    .select("plan_id, subscription_status, current_period_end")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !row) {
    return {
      planId: "free",
      subscriptionStatus: null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const status =
    typeof (row as Record<string, unknown>).subscription_status === "string"
      ? ((row as Record<string, unknown>).subscription_status as string).trim().toLowerCase()
      : "";

  const isValidStatus = (
    VALID_SUBSCRIPTION_STATUSES as readonly string[]
  ).includes(status);

  // 만료일 익일까지 이용 허용
  const periodEnd = (row as Record<string, unknown>).current_period_end as string | null;
  const isWithinGracePeriod = periodEnd
    ? new Date(periodEnd).getTime() + 24 * 60 * 60 * 1000 > Date.now()
    : false;

  if (!isValidStatus || !isWithinGracePeriod) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const planIdRaw =
    typeof row.plan_id === "string" ? row.plan_id.trim() : "";
  const basePlanId = PLAN_ID_TO_BASE[planIdRaw] ?? null;

  if (!basePlanId) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const plan = BILLING_PLANS.find((p) => p.id === basePlanId);
  if (!plan) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  return {
    planId: planIdRaw as EffectivePlanId,
    subscriptionStatus: status,
    channelLimit: plan.channels,
    monthlyAnalysisLimit: plan.monthlyAnalyses,
  };
}
