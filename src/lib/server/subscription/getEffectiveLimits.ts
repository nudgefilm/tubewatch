/**
 * 구독 기반 실제 사용 한도 계산.
 * user_subscriptions + BILLING_PLANS 기준. Admin 예외는 호출부에서 처리.
 * 유효 구독: active, trialing, manual, refunded + 만료 익일 이내.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillingPlanId,
  BILLING_PLANS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
} from "@/components/billing/types";

// refunded 포함: 기간까지 서비스 이용 허용 (정책: 기간 유지 후 종료)
const VALID_SUBSCRIPTION_STATUSES = ["active", "trialing", "manual", "refunded"] as const;
const FREE_CHANNEL_LIMIT = 1;

// 6개월 플랜 → 베이스 플랜 매핑
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

export async function getEffectiveLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<EffectiveLimitsResult> {
  const { data: row, error } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status, renewal_at, current_period_start")
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

  const r = row as Record<string, unknown>;
  const status = typeof r.status === "string" ? r.status.trim().toLowerCase() : "";
  const isValidStatus = (VALID_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);

  // 만료일 익일까지 이용 허용
  const renewalAt = r.renewal_at as string | null;
  const isWithinGracePeriod = renewalAt
    ? new Date(renewalAt).getTime() + 24 * 60 * 60 * 1000 > Date.now()
    : false;

  if (!isValidStatus || !isWithinGracePeriod) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const planIdRaw = typeof row.plan_id === "string" ? row.plan_id.trim() : "";
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
