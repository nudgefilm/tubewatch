export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/analysis/regenerate-module
 *
 * 타임아웃/실패로 pending 고착된 단일 원페이퍼 모듈을 재생성한다.
 * - 크레딧 차감 없음 (원래 분석에서 이미 차감됨)
 * - 본인 소유 스냅샷에 한해 동작 (user_id 검증)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildAnalysisReportPrompt,
  callGeminiForAnalysisReport,
} from "@/lib/server/onepager/generateAnalysisReport";
import {
  buildChannelDnaReportPrompt,
  callGeminiForChannelDnaReport,
} from "@/lib/server/onepager/generateChannelDnaReport";
import {
  buildStrategyPlanPrompt,
  callGeminiForStrategyPlan,
} from "@/lib/server/onepager/generateStrategyPlan";
import { generateNextTrendPlan } from "@/lib/server/onepager/generateNextTrendPlan";
import {
  generateChannelDnaNarrative,
  generateActionExecutionHints,
} from "@/lib/server/onepager/generateChannelDnaAndHints";

const ALLOWED_MODULES = [
  "analysis_report",
  "channel_dna_report",
  "strategy_plan",
  "next_trend",
  "channel_dna",
  "action_plan",
] as const;
type AllowedModule = (typeof ALLOWED_MODULES)[number];

const MARKDOWN_MODULES = new Set(["analysis_report", "channel_dna_report", "strategy_plan"]);

export async function POST(req: NextRequest) {
  try {
    let body: { channelId?: string; moduleKey?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
    }
    const { channelId, moduleKey } = body;

    if (!channelId || !moduleKey) {
      return NextResponse.json({ error: "channelId, moduleKey 필수" }, { status: 400 });
    }
    if (!ALLOWED_MODULES.includes(moduleKey as AllowedModule)) {
      return NextResponse.json({ error: "지원하지 않는 moduleKey" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 최신 스냅샷 조회 — user_id 필터로 소유자 검증
    const { data: row, error: snapErr } = await supabaseAdmin
      .from("analysis_results")
      .select("id, channel_title, gemini_raw_json, feature_snapshot, feature_total_score")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapErr || !row) {
      return NextResponse.json({ error: "분석 데이터 없음" }, { status: 404 });
    }

    const typedRow = row as Record<string, unknown>;
    const snapshotId = row.id as string;

    // 핵심 필드 유효성 검사 — null이면 Gemini가 빈 데이터로 무의미한 리포트 생성
    if (!typedRow.gemini_raw_json) {
      console.warn("[regenerate-module]", { channelId, moduleKey, snapshotId, error: "gemini_raw_json missing" });
      return NextResponse.json({ error: "분석 원본 데이터가 없습니다. 채널 재분석 후 다시 시도해주세요." }, { status: 422 });
    }
    if (!typedRow.feature_snapshot) {
      console.warn("[regenerate-module]", { channelId, moduleKey, snapshotId, error: "feature_snapshot missing" });
      return NextResponse.json({ error: "채널 지표 데이터가 없습니다. 채널 재분석 후 다시 시도해주세요." }, { status: 422 });
    }

    // 기존 row 조회 — pending 중복 실행 방지 + 기존 result 보존용
    const { data: existing } = await supabaseAdmin
      .from("analysis_module_results")
      .select("status, result, started_at")
      .eq("snapshot_id", snapshotId)
      .eq("module_key", moduleKey)
      .maybeSingle();

    if (existing?.status === "pending") {
      // 2분 이상 지난 pending은 고착 상태로 간주하고 재생성 허용
      const startedAt = (existing as Record<string, unknown>).started_at as string | undefined;
      const stalePending = !startedAt || Date.now() - new Date(startedAt).getTime() > 2 * 60 * 1000;
      if (!stalePending) {
        return NextResponse.json({ error: "이미 처리 중입니다. 잠시 후 다시 시도해주세요." }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const existingResult = (existing?.result ?? {}) as Record<string, unknown>;

    // Gemini 호출 전 pending 상태 선반영 (기존 result 보존)
    const { error: pendingErr } = await supabaseAdmin.from("analysis_module_results").upsert(
      {
        user_id: user.id,
        channel_id: channelId,
        snapshot_id: snapshotId,
        module_key: moduleKey,
        result: existingResult,
        status: "pending",
        started_at: now,
        error_message: null,
        analyzed_at: now,
      },
      { onConflict: "snapshot_id,module_key" }
    );

    if (pendingErr) {
      console.error("[regenerate-module]", { channelId, moduleKey, snapshotId, error: pendingErr });
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }

    // Gemini 호출
    let moduleResult: Record<string, unknown> | null = null;
    try {
      if (moduleKey === "analysis_report") {
        const md = await callGeminiForAnalysisReport(buildAnalysisReportPrompt(typedRow));
        if (md) moduleResult = { markdown: md };
      } else if (moduleKey === "channel_dna_report") {
        const md = await callGeminiForChannelDnaReport(buildChannelDnaReportPrompt(typedRow));
        if (md) moduleResult = { markdown: md };
      } else if (moduleKey === "strategy_plan") {
        const md = await callGeminiForStrategyPlan(buildStrategyPlanPrompt(typedRow));
        if (md) moduleResult = { markdown: md };
      } else if (moduleKey === "next_trend") {
        const plan = await generateNextTrendPlan(typedRow);
        if (plan) moduleResult = { plan };
      } else if (moduleKey === "channel_dna") {
        const narrative = await generateChannelDnaNarrative(typedRow);
        if (narrative) moduleResult = { narrative };
      } else if (moduleKey === "action_plan") {
        const execution_hints = await generateActionExecutionHints(typedRow);
        if (execution_hints) moduleResult = { execution_hints };
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const isOverloaded = (e as any)?.overloaded === true;
      console.error("[regenerate-module]", { channelId, moduleKey, snapshotId, error: errMsg });
      await supabaseAdmin.from("analysis_module_results").upsert(
        { user_id: user.id, channel_id: channelId, snapshot_id: snapshotId, module_key: moduleKey, result: existingResult, status: "failed", error_message: errMsg, analyzed_at: now },
        { onConflict: "snapshot_id,module_key" }
      );
      if (isOverloaded) {
        return NextResponse.json({ error: "GEMINI_OVERLOADED" }, { status: 503 });
      }
      return NextResponse.json({ error: `생성 실패: ${errMsg}` }, { status: 502 });
    }

    if (!moduleResult) {
      console.error("[regenerate-module]", { channelId, moduleKey, snapshotId, error: "empty_response" });
      await supabaseAdmin.from("analysis_module_results").upsert(
        { user_id: user.id, channel_id: channelId, snapshot_id: snapshotId, module_key: moduleKey, result: existingResult, status: "failed", error_message: "empty_response", analyzed_at: now },
        { onConflict: "snapshot_id,module_key" }
      );
      return NextResponse.json({ error: "생성 실패: empty_response (Gemini가 빈 응답 반환)" }, { status: 502 });
    }

    const completedAt = new Date().toISOString();
    const { error: upsertErr } = await supabaseAdmin.from("analysis_module_results").upsert(
      { user_id: user.id, channel_id: channelId, snapshot_id: snapshotId, module_key: moduleKey, result: moduleResult, status: "completed", completed_at: completedAt, analyzed_at: completedAt },
      { onConflict: "snapshot_id,module_key" }
    );

    if (upsertErr) {
      console.error("[regenerate-module]", { channelId, moduleKey, snapshotId, error: upsertErr });
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }

    // 마크다운 모듈은 클라이언트 즉시 반영용으로 markdown 반환, 나머지는 ok만 반환
    if (MARKDOWN_MODULES.has(moduleKey)) {
      return NextResponse.json({ ok: true, markdown: moduleResult.markdown });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[regenerate-module POST]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
