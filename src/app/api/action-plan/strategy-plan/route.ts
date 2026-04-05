import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { buildStrategyPlanPrompt, callGeminiForStrategyPlan } from "@/lib/server/onepager/generateStrategyPlan";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

/** GET — DB에서 저장된 strategy_plan 읽기 */
export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 최신 snapshot id 조회
    const { data: snap } = await supabase
      .from("analysis_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap) return NextResponse.json({ markdown: null, pending: false });

    // analysis_module_results에서 strategy_plan 읽기
    const { data: mod } = await supabaseAdmin
      .from("analysis_module_results")
      .select("result, status")
      .eq("snapshot_id", snap.id)
      .eq("module_key", "strategy_plan")
      .maybeSingle();

    if (!mod) return NextResponse.json({ markdown: null, pending: true });
    if (mod.status !== "completed") return NextResponse.json({ markdown: null, pending: true });

    const markdown = (mod.result as Record<string, unknown>)?.markdown as string | null;
    return NextResponse.json({ markdown: markdown ?? null, pending: false });
  } catch (e) {
    console.error("[strategy-plan GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/** POST — 어드민 전용 강제 재생성 */
export async function POST(req: NextRequest) {
  try {
    const { channelId } = await req.json();
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const { data: rows } = await supabase
      .from("analysis_results")
      .select("id, channel_title, gemini_raw_json, feature_snapshot")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!rows || rows.length === 0) return NextResponse.json({ error: "분석 데이터 없음" }, { status: 404 });

    const row = rows[0] as Record<string, unknown>;
    const prompt = buildStrategyPlanPrompt(row);
    const markdown = await callGeminiForStrategyPlan(prompt);
    if (!markdown) return NextResponse.json({ error: "생성 실패" }, { status: 502 });

    await supabaseAdmin.from("analysis_module_results").upsert({
      user_id: user.id,
      channel_id: channelId,
      snapshot_id: row.id,
      module_key: "strategy_plan",
      result: { markdown },
      status: "completed",
      analyzed_at: new Date().toISOString(),
    }, { onConflict: "snapshot_id,module_key" });

    return NextResponse.json({ markdown });
  } catch (e) {
    console.error("[strategy-plan POST]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
