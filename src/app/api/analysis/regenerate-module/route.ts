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

const ALLOWED_MODULES = ["analysis_report", "channel_dna_report", "strategy_plan"] as const;
type AllowedModule = (typeof ALLOWED_MODULES)[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { channelId?: string; moduleKey?: string };
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

    // 최신 스냅샷 조회 — supabase(user RLS)로 소유자 검증
    const { data: row, error: snapErr } = await supabase
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

    // 핵심 필드 유효성 검사 — null이면 Gemini가 빈 데이터로 무의미한 리포트 생성
    if (!typedRow.gemini_raw_json) {
      console.warn("[regenerate-module] gemini_raw_json missing", { snapshotId: row.id, moduleKey });
      return NextResponse.json({ error: "분석 원본 데이터가 없습니다. 채널 재분석 후 다시 시도해주세요." }, { status: 422 });
    }
    if (!typedRow.feature_snapshot) {
      console.warn("[regenerate-module] feature_snapshot missing", { snapshotId: row.id, moduleKey });
      return NextResponse.json({ error: "채널 지표 데이터가 없습니다. 채널 재분석 후 다시 시도해주세요." }, { status: 422 });
    }

    const now = new Date().toISOString();
    let markdown: string | null = null;

    if (moduleKey === "analysis_report") {
      markdown = await callGeminiForAnalysisReport(buildAnalysisReportPrompt(typedRow));
    } else if (moduleKey === "channel_dna_report") {
      markdown = await callGeminiForChannelDnaReport(buildChannelDnaReportPrompt(typedRow));
    } else if (moduleKey === "strategy_plan") {
      markdown = await callGeminiForStrategyPlan(buildStrategyPlanPrompt(typedRow));
    }

    if (!markdown) {
      return NextResponse.json({ error: "생성 실패" }, { status: 502 });
    }

    await supabaseAdmin.from("analysis_module_results").upsert(
      {
        user_id: user.id,
        channel_id: channelId,
        snapshot_id: row.id,
        module_key: moduleKey,
        result: { markdown },
        status: "completed",
        started_at: now,
        analyzed_at: now,
      },
      { onConflict: "snapshot_id,module_key" }
    );

    return NextResponse.json({ ok: true, markdown });
  } catch (e) {
    console.error("[regenerate-module POST]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
