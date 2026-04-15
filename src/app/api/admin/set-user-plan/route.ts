/**
 * POST /api/admin/set-user-plan
 * 특정 유저의 구독 플랜을 어드민이 수동으로 설정.
 * - "creator" | "pro" → user_subscriptions upsert (status: active, grant_type: manual)
 * - "free" → user_subscriptions row 삭제
 * - subscription_changes 이력 기록
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { BILLING_PLANS } from "@/components/billing/types";

const VALID_PLAN_IDS = ["creator", "pro", "free"] as const;
type PlanId = typeof VALID_PLAN_IDS[number];

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

    if (!targetUserId) {
      return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    }
    if (!VALID_PLAN_IDS.includes(planId as PlanId)) {
      return NextResponse.json({ error: "planId는 creator | pro | free 중 하나여야 합니다." }, { status: 400 });
    }

    // 기존 구독 조회 (이력 기록용)
    const { data: existing } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, subscription_status, renewal_at")
      .eq("user_id", targetUserId)
      .maybeSingle();

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
    const newExpiresAt = new Date(now);
    newExpiresAt.setUTCMonth(newExpiresAt.getUTCMonth() + 1);

    const { error: upsertError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert({
        user_id: targetUserId,
        plan_id: planId,
        subscription_status: "active",
        grant_type: "manual",
        manual_grant_reason: "어드민 직접 플랜 설정",
        last_plan_id: existing?.plan_id ?? null,
        current_period_start: now.toISOString(),
        renewal_at: newExpiresAt.toISOString(),
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

    return NextResponse.json({ ok: true, planId });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
