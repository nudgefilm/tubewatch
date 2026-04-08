import type { SupabaseClient } from "@supabase/supabase-js";

export type ModuleKey =
  | "action_plan"
  | "channel_dna"
  | "next_trend";

const ALLOWED_MODULE_KEYS: readonly ModuleKey[] = [
  "action_plan",
  "channel_dna",
  "next_trend",
];

function isModuleKey(v: unknown): v is ModuleKey {
  return ALLOWED_MODULE_KEYS.includes(v as ModuleKey);
}

/**
 * 각 모듈이 실제 사용하는 analysis_results 필드 슬라이스를 추출.
 * `source_snapshot_id`로 원본 row 역추적 가능.
 *
 * 모듈별 추출 기준:
 *   action_plan  — 액션 플랜 텍스트 + 섹션 점수 + 신뢰도 (feature_snapshot 불필요)
 *   channel_dna  — 패턴/강약 텍스트 + 섹션 점수 + feature_snapshot (영상 분포 분석)
 *   next_trend   — feature_snapshot.videos(트렌드 감지) + 분석 신뢰도
 */
function extractModulePayload(
  moduleKey: ModuleKey,
  result: Record<string, unknown>
): Record<string, unknown> {
  const base = { source_snapshot_id: result.id };

  switch (moduleKey) {
    case "action_plan":
      return {
        ...base,
        growth_action_plan: result.growth_action_plan ?? [],
        strengths: result.strengths ?? [],
        weaknesses: result.weaknesses ?? [],
        bottlenecks: result.bottlenecks ?? [],
        feature_section_scores: result.feature_section_scores ?? null,
        feature_total_score: result.feature_total_score ?? null,
        sample_size_note: result.sample_size_note ?? null,
        analysis_confidence: result.analysis_confidence ?? null,
      };

    case "channel_dna":
      return {
        ...base,
        content_pattern_summary: result.content_pattern_summary ?? null,
        content_patterns: result.content_patterns ?? [],
        strengths: result.strengths ?? [],
        weaknesses: result.weaknesses ?? [],
        feature_section_scores: result.feature_section_scores ?? null,
        feature_snapshot: result.feature_snapshot ?? null,
      };

    case "next_trend":
      return {
        ...base,
        feature_snapshot: result.feature_snapshot ?? null,
        analysis_confidence: result.analysis_confidence ?? null,
      };
  }
}

export type InsertModuleResultsParams = {
  analysisRunId: string;
  userId: string;
  channelId: string;
  /** analysis_results.id */
  snapshotId: string;
  /** FULL_MODULE_LIST 또는 partial 요청 배열 */
  requestedModules: readonly string[];
  /** analysis_results 전체 row (select("*") 결과) */
  resultRow: Record<string, unknown>;
  analyzedAt: string;
};

/**
 * requested_modules 기준으로 analysis_module_results에 1 module = 1 row 저장.
 *
 * 실패 처리 원칙:
 *   - 개별 모듈 저장 실패 → 콘솔 오류 + 다음 모듈 계속 진행 (non-fatal)
 *   - run 응답을 차단하지 않음
 *   - 실패한 모듈 key는 반환값 + 로그로 추적 가능
 *
 * 중복 방지:
 *   - analysis_run_id는 run마다 새로 생성되므로 같은 run에 대한 재처리 없음
 *   - DB unique 제약 없음 (migration 추가 금지 정책) → API 호출 단위 자연 방어
 */
export async function insertAnalysisModuleResults(
  supabase: SupabaseClient,
  params: InsertModuleResultsParams
): Promise<{ inserted: number; failed: string[] }> {
  const {
    analysisRunId,
    userId,
    channelId,
    snapshotId,
    requestedModules,
    resultRow,
    analyzedAt,
  } = params;

  const insertedModules: string[] = [];
  const failedModules: string[] = [];

  for (const moduleKeyRaw of requestedModules) {
    if (!isModuleKey(moduleKeyRaw)) {
      console.warn(
        "[insertAnalysisModuleResults] unknown module key skipped:",
        moduleKeyRaw
      );
      continue;
    }

    let payload: Record<string, unknown>;
    try {
      payload = extractModulePayload(moduleKeyRaw, resultRow);
    } catch (extractErr) {
      console.error(
        "[insertAnalysisModuleResults] payload extraction failed:",
        moduleKeyRaw,
        extractErr
      );
      failedModules.push(moduleKeyRaw);
      continue;
    }

    const { error } = await supabase.from("analysis_module_results").insert({
      analysis_run_id: analysisRunId,
      user_id: userId,
      channel_id: channelId,
      snapshot_id: snapshotId,
      module_key: moduleKeyRaw,
      result: payload,
      status: "completed",
      started_at: analyzedAt,
      analyzed_at: analyzedAt,
    });

    if (error) {
      console.error(
        "[insertAnalysisModuleResults] DB insert failed:",
        moduleKeyRaw,
        error.message,
        { analysisRunId }
      );
      failedModules.push(moduleKeyRaw);
    } else {
      insertedModules.push(moduleKeyRaw);
    }
  }

  if (failedModules.length > 0) {
    console.error(
      "[insertAnalysisModuleResults] partial failure:",
      { failed: failedModules, inserted: insertedModules, analysisRunId }
    );
  }

  return { inserted: insertedModules.length, failed: failedModules };
}
