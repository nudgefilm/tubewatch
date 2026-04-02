/**
 * POST /api/admin/reset-free-credits
 * Free 플랜 유저의 lifetime_analyses_used를 0으로 초기화.
 * Admin 전용 — profiles.role = 'admin' 체크.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const isAdmin = await isAdminUser(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const targetUserId = typeof raw.userId === "string" ? raw.userId.trim() : "";
  if (!targetUserId) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("user_credits")
    .update({ lifetime_analyses_used: 0 })
    .eq("user_id", targetUserId);

  if (error) {
    console.error("[reset-free-credits] DB error:", error.message);
    return NextResponse.json({ error: "초기화에 실패했습니다." }, { status: 500 });
  }

  console.log(`[reset-free-credits] reset lifetime_analyses_used for user=${targetUserId} by admin=${user.id}`);
  return NextResponse.json({ ok: true });
}
