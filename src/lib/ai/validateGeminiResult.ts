/**
 * Gemini 분석 결과 의미론적 유효성 검증
 *
 * HTTP 레벨 에러(503/429)는 callGemini에서 처리.
 * 이 모듈은 파싱 성공 후 결과의 '내용' 품질을 검증한다.
 */
import type { TubeWatchAnalysisResult } from "@/lib/ai/getGeminiConfig";

export type ValidationIssue = {
  field: string;
  reason: string;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; issues: ValidationIssue[] };

/** video_plan_document에서 ## 섹션 수를 카운트 */
export function countVpdSections(vpd: string): number {
  return (vpd.match(/^## /gm) ?? []).length;
}

/**
 * 분석 결과 유효성 검증.
 * issues가 있으면 valid: false 반환 — 호출측에서 재시도 판단에 사용.
 */
export function validateGeminiResult(
  result: TubeWatchAnalysisResult
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ── 기본 텍스트 필드 ──────────────────────────────────────────────
  if (!result.channel_summary || result.channel_summary.length < 20) {
    issues.push({ field: "channel_summary", reason: "너무 짧거나 비어있음" });
  }

  // ── 배열 필드 최소 길이 ───────────────────────────────────────────
  if (!result.content_patterns || result.content_patterns.length < 2) {
    issues.push({ field: "content_patterns", reason: "2개 미만" });
  }
  if (!result.growth_action_plan || result.growth_action_plan.length < 3) {
    issues.push({ field: "growth_action_plan", reason: "3개 미만" });
  }
  if (!result.strengths || result.strengths.length < 2) {
    issues.push({ field: "strengths", reason: "2개 미만" });
  }
  if (!result.weaknesses || result.weaknesses.length < 2) {
    issues.push({ field: "weaknesses", reason: "2개 미만" });
  }

  // ── next_trend_plan ───────────────────────────────────────────────
  if (result.next_trend_plan) {
    const vpd = result.next_trend_plan.video_plan_document ?? "";
    const sectionCount = countVpdSections(vpd);
    if (sectionCount < 6) {
      issues.push({
        field: "next_trend_plan.video_plan_document",
        reason: `섹션 ${sectionCount}/6 — 미완성`,
      });
    }
    if (!result.next_trend_plan.topic || result.next_trend_plan.topic.length < 2) {
      issues.push({ field: "next_trend_plan.topic", reason: "비어있음" });
    }
  }

  if (issues.length === 0) return { valid: true };
  return { valid: false, issues };
}
