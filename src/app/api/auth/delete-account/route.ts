/**
 * DELETE /api/auth/delete-account
 * 현재 로그인된 유저의 계정을 영구 삭제한다.
 * - 인증된 사용자 본인만 호출 가능
 * - 삭제 전 결제/구독 이력을 deleted_user_billing_archive에 보관 (전자상거래법 5년)
 * - supabaseAdmin.deleteUser 로 auth 및 관련 데이터 제거
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 결제/구독 이력 아카이브 — 전자상거래법 5년 보관 의무
    const { data: subRow } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, billing_period, subscription_status, payment_status, renewal_at, portone_payment_id, grant_type, credits, pending_plan_id, pending_billing_period")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subRow) {
      const { error: archiveErr } = await supabaseAdmin
        .from("deleted_user_billing_archive")
        .insert({
          original_user_id: user.id,
          email: user.email ?? null,
          plan_id: subRow.plan_id,
          billing_period: subRow.billing_period,
          subscription_status: subRow.subscription_status,
          payment_status: subRow.payment_status,
          renewal_at: subRow.renewal_at,
          portone_payment_id: subRow.portone_payment_id,
          grant_type: subRow.grant_type,
          credits: subRow.credits,
          pending_plan_id: subRow.pending_plan_id,
          pending_billing_period: subRow.pending_billing_period,
        });

      if (archiveErr) {
        // 아카이브 실패 시 계정 삭제 중단 — 법적 보관 의무 우선
        console.error("[delete-account] billing archive failed:", archiveErr.message);
        return NextResponse.json({ error: "결제 이력 보관 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
      }
    }

    // 탈퇴 일시 기록 — 삭제 전에 처리 (CASCADE로 지워지기 전)
    await supabaseAdmin
      .from("user_signup_log")
      .update({ withdrawn_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // shouldSoftDelete: false → hard delete, auth.identities까지 완전 제거
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id, false);

    if (error) {
      console.error("[delete-account] deleteUser error:", error.message);
      return NextResponse.json({ error: "계정 삭제에 실패했습니다." }, { status: 500 });
    }

    console.log(`[delete-account] user deleted: ${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[delete-account] uncaught exception:", msg);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
