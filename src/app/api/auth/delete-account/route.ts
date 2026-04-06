/**
 * DELETE /api/auth/delete-account
 * 현재 로그인된 유저의 계정을 영구 삭제한다.
 * - 인증된 사용자 본인만 호출 가능
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

    // shouldSoftDelete: false → hard delete, auth.identities까지 완전 제거
    // 소프트 딜리트 시 동일 Google 계정으로 재가입 불가
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
