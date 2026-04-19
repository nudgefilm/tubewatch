export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { buildStrategyPlanPrompt, callGeminiForStrategyPlan } from "@/lib/server/onepager/generateStrategyPlan";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET — strategy_plan 조회. 없으면 pending:true 반환 (생성은 메인 분석 route에서 처리). */
export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: snap } = await supabase
      .from("analysis_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap) return NextResponse.json({ markdown: null, pending: false });

    const { data: mod } = await supabaseAdmin
      .from("analysis_module_results")
      .select("result, status, started_at")
      .eq("snapshot_id", snap.id)
      .eq("user_id", user.id)
      .eq("module_key", "strategy_plan")
      .maybeSingle();

    if (!mod) return NextResponse.json({ markdown: null, pending: false, reason: "no_record" });
    if (mod.status === "failed") return NextResponse.json({ markdown: null, pending: false, reason: "failed" });
    if (mod.status === "pending") {
      const startedAt = mod.started_at ? new Date(mod.started_at as string).getTime() : null;
      if (startedAt === null) {
        console.warn("[onepager-api] timeout-fallback: started_at missing", { snapshot_id: snap.id, module_key: "strategy_plan" });
        return NextResponse.json({ markdown: null, pending: false, reason: "timeout" });
      }
      const isTimeout = Date.now() - startedAt > 10 * 60 * 1000;
      if (isTimeout) return NextResponse.json({ markdown: null, pending: false, reason: "timeout" });
      return NextResponse.json({ markdown: null, pending: true });
    }

    const modResult = mod.result as Record<string, unknown> | null;
    const markdown = typeof modResult?.markdown === "string" ? modResult.markdown : null;
    console.log("[onepager-api]", {
      snapshot_id: snap.id, module_key: "strategy_plan",
      status: mod.status, started_at: mod.started_at, hasMarkdown: !!markdown,
    });
    return NextResponse.json({ markdown: markdown ?? null, pending: false });
  } catch (e) {
    console.error("[strategy-plan GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/** POST — 어드민 전용 강제 재생성 */
export async function POST(req: NextRequest) {
  try {
    let body: { channelId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
    }
    const { channelId } = body;
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
    const snapshotId = row.id as string;

    // 기존 row 조회 — pending 중복 실행 방지 + 기존 result 보존용
    const { data: existing } = await supabaseAdmin
      .from("analysis_module_results")
      .select("status, result")
      .eq("snapshot_id", snapshotId)
      .eq("module_key", "strategy_plan")
      .maybeSingle();

    if (existing?.status === "pending") {
      return NextResponse.json({ error: "이미 처리 중입니다. 잠시 후 다시 시도해주세요." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const existingResult = (existing?.result ?? {}) as Record<string, unknown>;

    // Gemini 호출 전 pending 상태 선반영 (기존 result 보존)
    const { error: pendingErr } = await supabaseAdmin.from("analysis_module_results").upsert({
      user_id: user.id,
      channel_id: channelId,
      snapshot_id: snapshotId,
      module_key: "strategy_plan",
      result: existingResult,
      status: "pending",
      started_at: now,
      error_message: null,
      analyzed_at: now,
    }, { onConflict: "snapshot_id,module_key" });

    if (pendingErr) {
      console.error("[strategy-plan POST]", { channelId, moduleKey: "strategy_plan", snapshotId, error: pendingErr });
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }

    const prompt = buildStrategyPlanPrompt(row);
    let markdown: string | null = null;
    try {
      markdown = await callGeminiForStrategyPlan(prompt);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "unknown";
      console.error("[strategy-plan POST]", { channelId, moduleKey: "strategy_plan", snapshotId, error: errMsg });
      await supabaseAdmin.from("analysis_module_results").upsert({
        user_id: user.id, channel_id: channelId, snapshot_id: snapshotId,
        module_key: "strategy_plan", result: existingResult,
        status: "failed", error_message: errMsg, analyzed_at: now,
      }, { onConflict: "snapshot_id,module_key" });
      return NextResponse.json({ error: "생성 실패" }, { status: 502 });
    }

    if (!markdown) {
      console.error("[strategy-plan POST]", { channelId, moduleKey: "strategy_plan", snapshotId, error: "empty_response" });
      await supabaseAdmin.from("analysis_module_results").upsert({
        user_id: user.id, channel_id: channelId, snapshot_id: snapshotId,
        module_key: "strategy_plan", result: existingResult,
        status: "failed", error_message: "empty_response", analyzed_at: now,
      }, { onConflict: "snapshot_id,module_key" });
      return NextResponse.json({ error: "생성 실패" }, { status: 502 });
    }

    const completedAt = new Date().toISOString();
    const { error: upsertErr } = await supabaseAdmin.from("analysis_module_results").upsert({
      user_id: user.id,
      channel_id: channelId,
      snapshot_id: snapshotId,
      module_key: "strategy_plan",
      result: { markdown },
      status: "completed",
      completed_at: completedAt,
      analyzed_at: completedAt,
    }, { onConflict: "snapshot_id,module_key" });

    if (upsertErr) {
      console.error("[strategy-plan POST]", { channelId, moduleKey: "strategy_plan", snapshotId, error: upsertErr });
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }

    return NextResponse.json({ markdown });
  } catch (e) {
    console.error("[strategy-plan POST]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
