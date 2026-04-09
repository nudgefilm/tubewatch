/**
 * POST /api/admin/manual-grant
 * 이벤트 당첨자 등 수동 구독 권한 부여.
 * - 기존 active/manual 구독이 있으면 만료일에 기간 합산 (연장)
 * - 없으면 지금부터 기간 신규 부여
 * - subscription_changes 이력 기록
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";

const VALID_PLAN_IDS = ["creator", "creator_6m", "pro", "pro_6m"] as const;
type GrantPlanId = (typeof VALID_PLAN_IDS)[number];

const VALID_DURATIONS = [30, 90, 180] as const;
type DurationDays = (typeof VALID_DURATIONS)[number];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

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
    const planId = typeof body.planId === "string" ? body.planId.trim() as GrantPlanId : "";
    const durationDays = typeof body.durationDays === "number" ? body.durationDays as DurationDays : 0;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!targetUserId) return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    if (!VALID_PLAN_IDS.includes(planId as GrantPlanId)) {
      return NextResponse.json({ error: "planId가 유효하지 않습니다." }, { status: 400 });
    }
    if (!VALID_DURATIONS.includes(durationDays as DurationDays)) {
      return NextResponse.json({ error: "durationDays는 30 | 90 | 180 중 하나여야 합니다." }, { status: 400 });
    }
    if (!reason) return NextResponse.json({ error: "부여 사유(reason)가 필요합니다." }, { status: 400 });

    // 기존 구독 조회
    const { data: existing } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, subscription_status, current_period_end")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const now = new Date();
    const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;

    // 연장: 기존 만료일이 미래면 거기서 추가, 아니면 지금부터
    const baseDate = existingEnd && existingEnd > now ? existingEnd : now;
    const newExpiresAt = addDays(baseDate, durationDays);

    const upsertRow = {
      user_id: targetUserId,
      plan_id: planId,
      subscription_status: "manual",
      grant_type: "manual",
      manual_grant_reason: reason,
      last_plan_id: existing?.plan_id ?? null,
      current_period_start: now.toISOString(),
      current_period_end: newExpiresAt.toISOString(),
      stripe_customer_id: null,
      stripe_subscription_id: null,
      updated_at: now.toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(upsertRow, { onConflict: "user_id", ignoreDuplicates: false });

    if (upsertError) {
      return NextResponse.json({ error: `구독 설정 실패: ${upsertError.message}` }, { status: 500 });
    }

    // 이력 기록
    await supabaseAdmin.from("subscription_changes").insert({
      user_id: targetUserId,
      previous_plan_id: existing?.plan_id ?? null,
      new_plan_id: planId,
      previous_expires_at: existing?.current_period_end ?? null,
      new_expires_at: newExpiresAt.toISOString(),
      change_type: existing ? "manual_grant" : "new",
      change_source: "admin",
      note: reason,
      changed_by_admin_id: user.id,
    });

    console.log(`[manual-grant] ${planId} +${durationDays}d → expires ${newExpiresAt.toISOString()} | user=${targetUserId} | admin=${user.id} | reason=${reason}`);

    return NextResponse.json({
      ok: true,
      newExpiresAt: newExpiresAt.toISOString(),
      extended: !!(existingEnd && existingEnd > now),
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[manual-grant] uncaught:", msg);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
