import type { AnalysisHistoryItem } from "@/components/analysis/AnalysisHistoryList";
import type { CompareAnalysis } from "@/components/analysis/AnalysisCompareCard";

/**
 * analysis_results 행 타입 (DB 컬럼 + 선택적 대체 필드).
 * total_score, overall_score, section_scores는 DB에 있을 경우 fallback용.
 */
export type AnalysisResultRowForMap = {
  id: string;
  job_id?: string | null;
  created_at: string | null;
  gemini_analyzed_at?: string | null;
  feature_total_score: number | null;
  feature_section_scores: Record<string, number> | null;
  status: string | null;
  gemini_status: string | null;
  total_score?: number | null;
  overall_score?: number | null;
  section_scores?: Record<string, number> | null;
};

/**
 * analyzed_at 우선순위: gemini_analyzed_at > created_at
 */
function getAnalyzedAt(row: AnalysisResultRowForMap): string | null {
  return row.gemini_analyzed_at ?? row.created_at ?? null;
}

/**
 * total score 우선순위: feature_total_score > total_score > overall_score > null
 */
function getTotalScore(row: AnalysisResultRowForMap): number | null {
  if (row.feature_total_score != null) return row.feature_total_score;
  if (row.total_score != null) return row.total_score;
  if (row.overall_score != null) return row.overall_score;
  return null;
}

/**
 * section scores 우선순위: feature_section_scores > section_scores > null
 */
function getSectionScores(
  row: AnalysisResultRowForMap
): Record<string, number> | null {
  if (row.feature_section_scores != null) return row.feature_section_scores;
  if (row.section_scores != null) return row.section_scores;
  return null;
}

/**
 * ANALYSIS HISTORY용: raw row → AnalysisHistoryItem
 */
export function mapRowToHistoryItem(
  row: AnalysisResultRowForMap
): AnalysisHistoryItem {
  return {
    id: row.id,
    job_id: row.job_id ?? "",
    created_at: getAnalyzedAt(row),
    feature_total_score: getTotalScore(row),
    status: row.status,
    gemini_status: row.gemini_status,
  };
}

/**
 * ANALYSIS COMPARE용: raw row → CompareAnalysis
 */
export function mapRowToCompareAnalysis(
  row: AnalysisResultRowForMap
): CompareAnalysis {
  return {
    id: row.id,
    created_at: getAnalyzedAt(row),
    feature_total_score: getTotalScore(row),
    feature_section_scores: getSectionScores(row),
  };
}

/**
 * row를 그대로 유지하면서 feature_total_score, feature_section_scores만 fallback 적용.
 * Compare/History 표시용으로 page에서 latestResult/previousResult에 사용.
 */
export function enrichRowScores<T extends AnalysisResultRowForMap>(row: T): T {
  return {
    ...row,
    feature_total_score: getTotalScore(row),
    feature_section_scores: getSectionScores(row),
  };
}
