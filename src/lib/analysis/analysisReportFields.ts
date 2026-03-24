import type { CompareAnalysis } from "@/components/analysis/AnalysisCompareCard";
import type { AnalysisResultRow } from "@/lib/analysis/getAnalysisPageData";
import { enrichRowScores, mapRowToCompareAnalysis } from "@/lib/server/analysis/mapAnalysisHistoryAndCompare";

/** 리포트 상단·메타·점수·상태 — `buildAnalysisPageViewModel`에서 한 번만 생성 */
export type AnalysisReportPresentationVm = {
  /** 쿨다운·분석 시각 표시: gemini_analyzed_at ?? created_at */
  analysisTimestampIso: string | null;
  totalScore: number | null;
  sectionScores: Record<string, number> | null;
  sampleVideoCount: number | null;
  status: string | null;
  geminiStatus: string | null;
  geminiModel: string | null;
};

/** Gemini 텍스트·리스트 블록 — VM/스냅샷과 별도로 저장된 필드만 */
export type AnalysisReportAiFieldsVm = {
  id: string;
  channel_summary: string | null;
  content_pattern_summary: string | null;
  content_patterns: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  target_audience: string[] | null;
  recommended_topics: string[] | null;
  growth_action_plan: string[] | null;
};

export type AnalysisReportCompareVm = {
  current: CompareAnalysis;
  previous: CompareAnalysis | null;
};

function readString(row: AnalysisResultRow, key: string): string | null {
  const v = row[key];
  return typeof v === "string" ? v : null;
}

function readStringArray(row: AnalysisResultRow, key: string): string[] | null {
  const v = row[key];
  if (!Array.isArray(v)) return null;
  return v.filter((x): x is string => typeof x === "string");
}

export function buildAnalysisReportAiFields(
  row: AnalysisResultRow
): AnalysisReportAiFieldsVm {
  return {
    id: row.id,
    channel_summary: readString(row, "channel_summary"),
    content_pattern_summary: readString(row, "content_pattern_summary"),
    content_patterns: readStringArray(row, "content_patterns"),
    strengths: readStringArray(row, "strengths"),
    weaknesses: readStringArray(row, "weaknesses"),
    bottlenecks: readStringArray(row, "bottlenecks"),
    target_audience: readStringArray(row, "target_audience"),
    recommended_topics: readStringArray(row, "recommended_topics"),
    growth_action_plan: readStringArray(row, "growth_action_plan"),
  };
}

export function buildAnalysisReportPresentation(
  row: AnalysisResultRow,
  sampleVideoCountFromVm: number | null
): AnalysisReportPresentationVm {
  const geminiAt = readString(row, "gemini_analyzed_at");
  const createdAt = readString(row, "created_at");
  const ts = geminiAt ?? createdAt ?? null;

  const secRaw = row.feature_section_scores;
  let sectionScores: Record<string, number> | null = null;
  if (secRaw && typeof secRaw === "object" && !Array.isArray(secRaw)) {
    const o = secRaw as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        out[k] = v;
      }
    }
    sectionScores = Object.keys(out).length > 0 ? out : null;
  }

  const fts = row.feature_total_score;
  const totalScore =
    typeof fts === "number" && Number.isFinite(fts) ? fts : null;

  return {
    analysisTimestampIso: ts,
    totalScore,
    sectionScores,
    sampleVideoCount: sampleVideoCountFromVm,
    status: readString(row, "status"),
    geminiStatus: readString(row, "gemini_status"),
    geminiModel: readString(row, "gemini_model"),
  };
}

export function buildAnalysisReportCompareVm(
  current: AnalysisResultRow,
  previous: AnalysisResultRow | null
): AnalysisReportCompareVm {
  return {
    current: mapRowToCompareAnalysis(enrichRowScores(current)),
    previous:
      previous != null
        ? mapRowToCompareAnalysis(enrichRowScores(previous))
        : null,
  };
}
