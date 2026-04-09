/**
 * POST /api/admin/process-refund
 * 환불 처리 (Option B: 기간 유지 후 종료).
 * - current_period_end 유지 (해당일까지 이용 가능)
 * - subscription_status → 'refunded' (재구독 방지)
 * - subscription_changes 이력 기록
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";

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
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!targetUserId) return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    if (!note) return NextResponse.json({ error: "환불 사유(note)가 필요합니다." }, { status: 400 });

    // 현재 구독 조회
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, subscription_status, current_period_end")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "활성 구독이 없습니다." }, { status: 404 });
    }
    if (existing.subscription_status === "refunded") {
      return NextResponse.json({ error: "이미 환불 처리된 구독입니다." }, { status: 409 });
    }

    // Option B: 기간은 유지, status만 refunded로 변경
    const { error: updateError } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        subscription_status: "refunded",
        last_plan_id: existing.plan_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (updateError) {
      return NextResponse.json({ error: `환불 처리 실패: ${updateError.message}` }, { status: 500 });
    }

    // 이력 기록
    await supabaseAdmin.from("subscription_changes").insert({
      user_id: targetUserId,
      previous_plan_id: existing.plan_id,
      new_plan_id: existing.plan_id,
      previous_expires_at: existing.current_period_end,
      new_expires_at: existing.current_period_end,
      change_type: "refund",
      change_source: "admin",
      note,
      changed_by_admin_id: user.id,
    });

    console.log(`[process-refund] refunded | user=${targetUserId} | admin=${user.id} | note=${note}`);

    return NextResponse.json({
      ok: true,
      currentPeriodEnd: existing.current_period_end,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
