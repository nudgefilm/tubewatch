/**
 * 구독 기반 실제 사용 한도 계산.
 * 플랜 판단 기준: current_period_end — subscription_status 값과 무관.
 * 만료 시 무조건 free fallback. Admin 예외는 호출부에서 처리.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillingPlanId,
  BILLING_PLANS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
} from "@/components/billing/types";

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

const FREE_RESULT = (subscriptionStatus: string | null): EffectiveLimitsResult => ({
  planId: "free",
  subscriptionStatus,
  channelLimit: FREE_CHANNEL_LIMIT,
  monthlyAnalysisLimit: FREE_LIFETIME_ANALYSIS_LIMIT,
});

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

  if (error || !row) return FREE_RESULT(null);

  const r = row as Record<string, unknown>;
  const status = typeof r.subscription_status === "string"
    ? r.subscription_status.trim().toLowerCase()
    : null;

  // current_period_end 기준 만료 여부 — subscription_status 값과 무관하게 판단
  const periodEnd = r.current_period_end as string | null;
  const isExpired = !periodEnd || new Date(periodEnd).getTime() < Date.now();

  if (isExpired) return FREE_RESULT(status);

  const planIdRaw = typeof row.plan_id === "string" ? row.plan_id.trim() : "";
  const basePlanId = PLAN_ID_TO_BASE[planIdRaw] ?? null;
  if (!basePlanId) return FREE_RESULT(status);

  const plan = BILLING_PLANS.find((p) => p.id === basePlanId);
  if (!plan) return FREE_RESULT(status);

  return {
    planId: planIdRaw as EffectivePlanId,
    subscriptionStatus: status,
    channelLimit: plan.channels,
    monthlyAnalysisLimit: plan.monthlyAnalyses,
  };
}
