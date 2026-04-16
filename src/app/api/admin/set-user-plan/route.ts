/**
 * POST /api/admin/set-user-plan
 * 특정 유저의 구독 플랜을 어드민이 수동으로 설정.
 * - "creator" | "pro" + billingPeriod
 *   - 활성 구독 중 업그레이드: 즉시 적용, renewal_at += 새 기간
 *   - 활성 구독 중 다운그레이드: pending_plan_id / pending_billing_period 저장
 *   - 신규/만료: 즉시 적용
 * - "free" → user_subscriptions row 삭제
 * - subscription_changes 이력 기록
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { BILLING_PLANS, type BillingPeriod } from "@/components/billing/types";

const VALID_PLAN_IDS = ["creator", "pro", "free"] as const;
type PlanId = (typeof VALID_PLAN_IDS)[number];

const PLAN_RANK: Record<string, number> = { creator: 1, pro: 2 };
const PERIOD_MONTHS: Record<BillingPeriod, number> = { monthly: 1, semiannual: 6 };

type ExistingSubRow = {
  plan_id: string | null;
  billing_period: string | null;
  subscription_status: string | null;
  renewal_at: string | null;
  pending_plan_id: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const targetUserId = typeof body.userId === "string" ? body.userId.trim() : "";
    const planId = typeof body.planId === "string" ? body.planId.trim() as PlanId : "";
    const billingPeriod: BillingPeriod =
      body.billingPeriod === "semiannual" ? "semiannual" : "monthly";

    if (!targetUserId) {
      return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    }
    if (!VALID_PLAN_IDS.includes(planId as PlanId)) {
      return NextResponse.json({ error: "planId는 creator | pro | free 중 하나여야 합니다." }, { status: 400 });
    }

    // 기존 구독 조회
    const { data: existingRaw } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, billing_period, subscription_status, renewal_at, pending_plan_id")
      .eq("user_id", targetUserId)
      .maybeSingle();
    const existing = existingRaw as ExistingSubRow | null;

    // ── free: 구독 삭제 ────────────────────────────────────────────────────────
    if (planId === "free") {
      const { error } = await supabaseAdmin
        .from("user_subscriptions")
        .delete()
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json({ error: "플랜 초기화에 실패했습니다." }, { status: 500 });
      }

      await supabaseAdmin.from("subscription_changes").insert({
        user_id: targetUserId,
        previous_plan_id: existing?.plan_id ?? null,
        new_plan_id: "free",
        previous_expires_at: existing?.renewal_at ?? null,
        new_expires_at: null,
        change_type: "cancel",
        change_source: "admin",
        note: "어드민 플랜 초기화",
        changed_by_admin_id: user.id,
      });

      return NextResponse.json({ ok: true, planId: "free" });
    }

    const plan = BILLING_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "알 수 없는 플랜입니다." }, { status: 400 });
    }

    const now = new Date();
    const existingRenewalAt = existing?.renewal_at ?? null;

    // 활성 구독 여부 판단 (active | manual 상태 + 만료 전)
    const isActive =
      (existing?.subscription_status === "active" || existing?.subscription_status === "manual") &&
      existingRenewalAt !== null &&
      new Date(existingRenewalAt).getTime() > now.getTime();

    if (isActive) {
      const currentRank = PLAN_RANK[existing!.plan_id ?? ""] ?? 0;
      const targetRank = PLAN_RANK[planId] ?? 0;
      const isUpgrade = targetRank >= currentRank;

      if (isUpgrade) {
        // ── 업그레이드: 즉시 적용, renewal_at += 새 기간 ─────────────────────
        const months = PERIOD_MONTHS[billingPeriod];
        const newRenewalAt = new Date(existingRenewalAt!);
        newRenewalAt.setMonth(newRenewalAt.getMonth() + months);

        const { error: updateError } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            plan_id: planId,
            billing_period: billingPeriod,
            renewal_at: newRenewalAt.toISOString(),
            subscription_status: "active",
            grant_type: "manual",
            manual_grant_reason: "어드민 직접 플랜 설정",
            pending_plan_id: null,
            pending_billing_period: null,
            updated_at: now.toISOString(),
          })
          .eq("user_id", targetUserId);

        if (updateError) {
          return NextResponse.json({ error: `플랜 설정 실패: ${updateError.message}` }, { status: 500 });
        }

        await supabaseAdmin.from("subscription_changes").insert({
          user_id: targetUserId,
          previous_plan_id: existing?.plan_id ?? null,
          new_plan_id: planId,
          previous_expires_at: existingRenewalAt,
          new_expires_at: newRenewalAt.toISOString(),
          change_type: "upgrade",
          change_source: "admin",
          note: "어드민 직접 플랜 설정 (즉시 적용)",
          changed_by_admin_id: user.id,
        });

        return NextResponse.json({ ok: true, planId, billingPeriod, deferred: false });
      } else {
        // ── 다운그레이드: pending 저장, 기존 plan/renewal_at 유지 ─────────────
        const { error: updateError } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            pending_plan_id: planId,
            pending_billing_period: billingPeriod,
            updated_at: now.toISOString(),
          })
          .eq("user_id", targetUserId);

        if (updateError) {
          return NextResponse.json({ error: `플랜 설정 실패: ${updateError.message}` }, { status: 500 });
        }

        await supabaseAdmin.from("subscription_changes").insert({
          user_id: targetUserId,
          previous_plan_id: existing?.plan_id ?? null,
          new_plan_id: planId,
          previous_expires_at: existingRenewalAt,
          new_expires_at: existingRenewalAt,
          change_type: "downgrade",
          change_source: "admin",
          note: "어드민 직접 플랜 설정 (만료 후 적용)",
          changed_by_admin_id: user.id,
        });

        return NextResponse.json({ ok: true, planId, billingPeriod, deferred: true });
      }
    }

    // ── 신규 or 만료 → 즉시 적용 ──────────────────────────────────────────────
    const months = PERIOD_MONTHS[billingPeriod];
    const newExpiresAt = new Date(now);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

    const { error: upsertError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert({
        user_id: targetUserId,
        plan_id: planId,
        billing_period: billingPeriod,
        subscription_status: "active",
        grant_type: "manual",
        manual_grant_reason: "어드민 직접 플랜 설정",
        last_plan_id: existing?.plan_id ?? null,
        current_period_start: now.toISOString(),
        renewal_at: newExpiresAt.toISOString(),
        pending_plan_id: null,
        pending_billing_period: null,
        updated_at: now.toISOString(),
      }, { onConflict: "user_id", ignoreDuplicates: false });

    if (upsertError) {
      return NextResponse.json({ error: `플랜 설정 실패: ${upsertError.message}` }, { status: 500 });
    }

    await supabaseAdmin.from("subscription_changes").insert({
      user_id: targetUserId,
      previous_plan_id: existing?.plan_id ?? null,
      new_plan_id: planId,
      previous_expires_at: existing?.renewal_at ?? null,
      new_expires_at: newExpiresAt.toISOString(),
      change_type: existing ? "upgrade" : "new",
      change_source: "admin",
      note: "어드민 직접 플랜 설정",
      changed_by_admin_id: user.id,
    });

    return NextResponse.json({ ok: true, planId, billingPeriod, deferred: false });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
