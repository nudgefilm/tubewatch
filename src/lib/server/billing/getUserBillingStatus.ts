import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BILLING_PLANS } from "@/components/billing/types";

export type UserBillingStatus = {
  planId: "free" | "creator" | "pro";
  billingPeriod: "monthly" | "semiannual" | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  lifetimeAnalysesUsed: number;
  purchasedCredits: number;
  monthlyCreditsUsed: number;
  /** 만료 후 적용될 예약 플랜 ID. 없으면 null. */
  pendingPlanId: string | null;
  /** 만료 후 적용될 예약 결제 주기. 없으면 null. */
  pendingBillingPeriod: "monthly" | "semiannual" | null;
};

const PLAN_ID_TO_BASE: Record<string, "creator" | "pro"> = {
  creator: "creator",
  pro: "pro",
};

// 결제 주기 → 구독 기간(월) 매핑
const PERIOD_MONTHS: Record<string, number> = {
  monthly: 1,
  semiannual: 6,
};

export async function getUserBillingStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBillingStatus> {
  const [subRes, creditsRes] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("plan_id, billing_period, subscription_status, renewal_at, pending_plan_id, pending_billing_period")
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
    billing_period: string | null;
    subscription_status: string | null;
    renewal_at: string | null;
    pending_plan_id: string | null;
    pending_billing_period: string | null;
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

  const rawPendingBillingPeriod = sub?.pending_billing_period ?? null;
  const pendingBillingPeriodRaw: "monthly" | "semiannual" | null =
    rawPendingBillingPeriod === "monthly" || rawPendingBillingPeriod === "semiannual"
      ? rawPendingBillingPeriod
      : null;

  let activePlanIdRaw = typeof sub?.plan_id === "string" ? sub.plan_id.trim() : "";

  const rawBillingPeriod = sub?.billing_period ?? null;
  let activeBillingPeriod: "monthly" | "semiannual" | null =
    rawBillingPeriod === "monthly" || rawBillingPeriod === "semiannual"
      ? rawBillingPeriod
      : null;
  let activePeriodEnd = periodEnd;
  let activePendingPlanId = pendingPlanIdRaw;
  let activePendingBillingPeriod = pendingBillingPeriodRaw;
  let activeSubscriptionStatus =
    typeof sub?.subscription_status === "string"
      ? sub.subscription_status.trim().toLowerCase()
      : null;

  // ─── 만료된 구독에 예약 플랜이 있으면 자동 승격 (1회 실행 보장) ────────────
  if (isExpired && pendingPlanIdRaw) {
    const pendingPeriod = pendingBillingPeriodRaw ?? "monthly";
    const months = PERIOD_MONTHS[pendingPeriod] ?? 1;
    const baseDate = periodEnd ? new Date(periodEnd) : new Date();
    const newRenewalAt = new Date(baseDate);
    newRenewalAt.setMonth(newRenewalAt.getMonth() + months);
    const newRenewalAtIso = newRenewalAt.toISOString();

    // pending_plan_id 조건을 함께 걸어 중복 실행 방지
    const { error: applyError } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        plan_id: pendingPlanIdRaw,
        billing_period: pendingPeriod,
        pending_plan_id: null,
        pending_billing_period: null,
        renewal_at: newRenewalAtIso,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("pending_plan_id", pendingPlanIdRaw);

    if (!applyError) {
      activePlanIdRaw = pendingPlanIdRaw;
      activeBillingPeriod = pendingPeriod;
      activePeriodEnd = newRenewalAtIso;
      activePendingPlanId = null;
      activePendingBillingPeriod = null;
      activeSubscriptionStatus = "active";

      // 다운그레이드 시 초과 채널 삭제 — 최신 등록 채널 N개 외 제거
      const newPlan = BILLING_PLANS.find((p) => p.id === pendingPlanIdRaw);
      if (newPlan) {
        const { data: allChannels } = await supabaseAdmin
          .from("user_channels")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }); // 오래된 채널이 앞에
        const channels = (allChannels ?? []) as { id: string }[];
        if (channels.length > newPlan.channels) {
          const toDeleteIds = channels
            .slice(0, channels.length - newPlan.channels)
            .map((c) => c.id);
          const cascadeSteps = [
            { table: "credit_reservations",     field: "channel_id" },
            { table: "credit_logs",             field: "channel_id" },
            { table: "analysis_module_results", field: "channel_id" },
            { table: "analysis_jobs",           field: "user_channel_id" },
            { table: "analysis_runs",           field: "channel_id" },
            { table: "analysis_results",        field: "user_channel_id" },
          ] as const;
          for (const { table, field } of cascadeSteps) {
            await supabaseAdmin.from(table).delete().eq("user_id", userId).in(field, toDeleteIds);
          }
          await supabaseAdmin.from("user_channels").delete().eq("user_id", userId).in("id", toDeleteIds);
        }
      }
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
    billingPeriod: !activeIsExpired && basePlanId ? activeBillingPeriod : null,
    subscriptionStatus: activeSubscriptionStatus,
    currentPeriodEnd: activePeriodEnd,
    lifetimeAnalysesUsed: credits?.lifetime_analyses_used ?? 0,
    purchasedCredits: credits?.purchased_credits ?? 0,
    monthlyCreditsUsed: credits?.credits_used ?? 0,
    pendingPlanId: activePendingPlanId,
    pendingBillingPeriod: activePendingBillingPeriod,
  };
}
