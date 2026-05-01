/**
 * POST /api/analysis/worker
 *
 * onepager 전용 워커 (request/route.ts 분리 아키텍처).
 *
 * 동작 원칙:
 *   1. pending 모듈 확인 후 즉시 200 반환
 *      → request/route.ts 의 waitUntil(fetch) 가 여기서 해제됨
 *   2. 내부 waitUntil 로 Gemini onepager 병렬 실행
 *      → 별도 Vercel execution slot 에서 독립 실행
 *
 * input queue: analysis_module_results (status = 'pending')
 * output:      analysis_module_results (status = 'completed' | 'failed')
 */
export const maxDuration = 90;

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
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

const ONEPAGER_KEYS = [
  "analysis_report",
  "channel_dna_report",
  "strategy_plan",
  "next_trend",
  "channel_dna",
  "action_plan",
] as const;
type OnepagerKey = (typeof ONEPAGER_KEYS)[number];

// ── 모듈 실행 헬퍼 ─────────────────────────────────────────────────────────────

async function runModule(
  fn: () => Promise<string | null>,
  moduleKey: string,
  snapshotId: string
): Promise<void> {
  const start = Date.now();
  try {
    const markdown = await fn();
    if (!markdown) throw new Error("empty markdown");
    await supabaseAdmin
      .from("analysis_module_results")
      .update({
        status: "completed",
        result: { markdown },
        analyzed_at: new Date().toISOString(),
      })
      .eq("snapshot_id", snapshotId)
      .eq("module_key", moduleKey)
      .neq("status", "completed");
    console.log("[onepager-worker]", {
      module: moduleKey,
      duration: Date.now() - start,
      status: "completed",
    });
  } catch (e) {
    await supabaseAdmin
      .from("analysis_module_results")
      .update({
        status: "failed",
        error_message: String(e).slice(0, 500),
      })
      .eq("snapshot_id", snapshotId)
      .eq("module_key", moduleKey)
      .neq("status", "completed");
    console.error("[onepager-worker]", {
      module: moduleKey,
      duration: Date.now() - start,
      status: "failed",
      error: String(e).slice(0, 200),
    });
    throw e;
  }
}

async function runModulePlan(
  fn: () => Promise<Record<string, unknown>>,
  moduleKey: string,
  snapshotId: string
): Promise<void> {
  const start = Date.now();
  try {
    const result = await fn();
    await supabaseAdmin
      .from("analysis_module_results")
      .update({
        status: "completed",
        result,
        analyzed_at: new Date().toISOString(),
      })
      .eq("snapshot_id", snapshotId)
      .eq("module_key", moduleKey)
      .neq("status", "completed");
    console.log("[onepager-worker]", {
      module: moduleKey,
      duration: Date.now() - start,
      status: "completed",
    });
  } catch (e) {
    await supabaseAdmin
      .from("analysis_module_results")
      .update({
        status: "failed",
        error_message: String(e).slice(0, 500),
      })
      .eq("snapshot_id", snapshotId)
      .eq("module_key", moduleKey)
      .neq("status", "completed");
    console.error("[onepager-worker]", {
      module: moduleKey,
      duration: Date.now() - start,
      status: "failed",
      error: String(e).slice(0, 200),
    });
    throw e;
  }
}

// ── 핸들러 ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const snapshotId =
    typeof raw.snapshotId === "string" ? raw.snapshotId.trim() : "";

  if (!snapshotId) {
    return NextResponse.json(
      { ok: false, error: "snapshotId required" },
      { status: 400 }
    );
  }

  // 스냅샷 컨텍스트 로드 (Gemini 프롬프트 빌드용)
  const { data: snapshotRow, error: snapshotErr } = await supabaseAdmin
    .from("analysis_results")
    .select(
      "id, gemini_raw_json, feature_snapshot, channel_title, feature_total_score"
    )
    .eq("id", snapshotId)
    .maybeSingle();

  if (snapshotErr || !snapshotRow) {
    console.error(
      "[onepager-worker] snapshot not found:",
      snapshotId,
      snapshotErr?.message ?? "null row"
    );
    return NextResponse.json(
      { ok: false, error: "snapshot not found" },
      { status: 404 }
    );
  }

  // pending 모듈 목록 조회
  const { data: pendingMods } = await supabaseAdmin
    .from("analysis_module_results")
    .select("module_key")
    .eq("snapshot_id", snapshotId)
    .eq("status", "pending")
    .in("module_key", ONEPAGER_KEYS);

  const modulesToRun = (pendingMods ?? []).map(
    (m: { module_key: string }) => m.module_key as OnepagerKey
  );

  if (modulesToRun.length === 0) {
    console.log("[onepager-worker] no pending modules:", snapshotId);
    return NextResponse.json({ ok: true, ran: 0 });
  }

  const rawJson = snapshotRow.gemini_raw_json;
  const featureSnapshot = snapshotRow.feature_snapshot;
  const channelTitle = snapshotRow.channel_title;
  const featureTotalScore = snapshotRow.feature_total_score;

  // ✅ 핵심 2단 구조:
  //   waitUntil 등록 (비동기 작업 예약)
  //   → 즉시 200 반환 (request 슬롯 해제)
  //   → 워커 자체 슬롯에서 Gemini 실행
  waitUntil(
    (async () => {
      const results = await Promise.allSettled(
        modulesToRun.map((key) => {
          switch (key) {
            case "analysis_report":
              return runModule(
                () =>
                  callGeminiForAnalysisReport(
                    buildAnalysisReportPrompt({
                      gemini_raw_json: rawJson,
                      feature_snapshot: featureSnapshot,
                      channel_title: channelTitle,
                      feature_total_score: featureTotalScore,
                    })
                  ),
                key,
                snapshotId
              );
            case "channel_dna_report":
              return runModule(
                () =>
                  callGeminiForChannelDnaReport(
                    buildChannelDnaReportPrompt({
                      gemini_raw_json: rawJson,
                      feature_snapshot: featureSnapshot,
                      channel_title: channelTitle,
                    })
                  ),
                key,
                snapshotId
              );
            case "strategy_plan":
              return runModule(
                () =>
                  callGeminiForStrategyPlan(
                    buildStrategyPlanPrompt({
                      gemini_raw_json: rawJson,
                      feature_snapshot: featureSnapshot,
                      channel_title: channelTitle,
                    })
                  ),
                key,
                snapshotId
              );
            case "next_trend":
              return runModulePlan(
                async () => {
                  const plan = await generateNextTrendPlan({
                    gemini_raw_json: rawJson,
                    feature_snapshot: featureSnapshot,
                    channel_title: channelTitle,
                  });
                  return { plan };
                },
                key,
                snapshotId
              );
            case "channel_dna":
              return runModulePlan(
                async () => {
                  const narrative = await generateChannelDnaNarrative({
                    gemini_raw_json: rawJson,
                    feature_snapshot: featureSnapshot,
                    channel_title: channelTitle,
                  });
                  return { narrative };
                },
                key,
                snapshotId
              );
            case "action_plan":
              return runModulePlan(
                async () => {
                  const execution_hints = await generateActionExecutionHints({
                    gemini_raw_json: rawJson,
                    feature_snapshot: featureSnapshot,
                    channel_title: channelTitle,
                  });
                  return { execution_hints };
                },
                key,
                snapshotId
              );
            default:
              return Promise.reject(new Error(`unknown module: ${key}`));
          }
        })
      );

      console.log("[onepager-worker/allsettled]", {
        snapshot_id: snapshotId,
        results: results.map((r, i) => ({
          module: modulesToRun[i],
          outcome: r.status,
          reason:
            r.status === "rejected"
              ? String(r.reason).slice(0, 200)
              : undefined,
        })),
      });
    })()
  );

  // 즉시 반환 — request/route.ts 의 waitUntil(fetch) 를 여기서 해제
  return NextResponse.json({ ok: true, ran: modulesToRun.length });
}
