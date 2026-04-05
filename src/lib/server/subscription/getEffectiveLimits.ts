/**
 * 구독 기반 실제 사용 한도 계산.
 * user_subscriptions + BILLING_PLANS 기준. Admin 예외는 호출부에서 처리.
 * 유효 구독: active, trialing만 인정.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillingPlanId,
  BILLING_PLANS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
} from "@/components/billing/types";

const VALID_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
const FREE_CHANNEL_LIMIT = 1;

const BILLING_PLAN_IDS: BillingPlanId[] = ["creator", "pro"];

function isValidPlanId(value: string): value is BillingPlanId {
  return BILLING_PLAN_IDS.includes(value as BillingPlanId);
}

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
    .select("plan_id, status")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      planId: "free",
      subscriptionStatus: null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  if (!row) {
    return {
      planId: "free",
      subscriptionStatus: null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const status =
    typeof (row as Record<string, unknown>).status === "string"
      ? ((row as Record<string, unknown>).status as string).trim().toLowerCase()
      : "";
  const isValidStatus = (
    VALID_SUBSCRIPTION_STATUSES as readonly string[]
  ).includes(status);

  if (!isValidStatus) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const planIdRaw =
    typeof row.plan_id === "string" ? row.plan_id.trim() : "";
  if (!planIdRaw || !isValidPlanId(planIdRaw)) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  const plan = BILLING_PLANS.find((p) => p.id === planIdRaw);
  if (!plan) {
    return {
      planId: "free",
      subscriptionStatus: status || null,
      channelLimit: FREE_CHANNEL_LIMIT,
      monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
    };
  }

  return {
    planId: plan.id,
    subscriptionStatus: status,
    channelLimit: plan.channels,
    monthlyAnalysisLimit: plan.monthlyAnalyses,
  };
}
