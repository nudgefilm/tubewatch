/**
 * POST /api/admin/credit-grant
 * 어드민 CS — 유저에게 단건 크레딧 수동 부여.
 * Body: { userId: string, count: number (1-99), reason?: string }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { addPurchasedCredits } from "@/lib/server/analysis/checkUserCredits";

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
    const count = typeof body.count === "number" ? Math.floor(body.count) : 0;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!targetUserId) {
      return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    }
    if (count < 1 || count > 99) {
      return NextResponse.json({ error: "count는 1–99 사이 정수여야 합니다." }, { status: 400 });
    }

    await addPurchasedCredits(supabaseAdmin, targetUserId, count);

    // user_subscriptions.credits 누적 동기화
    const { data: subRow } = await supabaseAdmin
      .from("user_subscriptions")
      .select("credits")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const currentCredits = (subRow?.credits as number | null) ?? 0;
    await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        { user_id: targetUserId, credits: currentCredits + count },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    console.log(`[credit-grant] +${count} credits | user=${targetUserId} | admin=${user.id}${reason ? ` | reason=${reason}` : ""}`);

    return NextResponse.json({ ok: true, credits: count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[credit-grant] uncaught:", msg);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
