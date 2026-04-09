/**
 * GET /api/admin/subscription-history?userId=xxx
 * 특정 유저의 플랜 변경 이력 조회 (CS 응대용).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId")?.trim() ?? "";
    if (!targetUserId) {
      return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("subscription_changes")
      .select("id, changed_at, previous_plan_id, new_plan_id, previous_expires_at, new_expires_at, change_type, change_source, note")
      .eq("user_id", targetUserId)
      .order("changed_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, history: data ?? [] });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
