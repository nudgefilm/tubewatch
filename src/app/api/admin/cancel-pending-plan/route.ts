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
    if (!targetUserId) {
      return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, renewal_at, pending_plan_id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!existing?.pending_plan_id) {
      return NextResponse.json({ error: "예약된 다운그레이드가 없습니다." }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({ pending_plan_id: null, pending_billing_period: null, updated_at: now })
      .eq("user_id", targetUserId);

    if (error) {
      return NextResponse.json({ error: "취소 처리에 실패했습니다." }, { status: 500 });
    }

    await supabaseAdmin.from("subscription_changes").insert({
      user_id: targetUserId,
      previous_plan_id: existing.plan_id,
      new_plan_id: existing.plan_id,
      previous_expires_at: existing.renewal_at,
      new_expires_at: existing.renewal_at,
      change_type: "pending_cancel",
      change_source: "admin",
      note: `어드민 다운그레이드 예약 취소 (${existing.pending_plan_id} 예약 취소됨)`,
      changed_by_admin_id: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
