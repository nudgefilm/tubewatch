import { describe, it, expect } from "vitest";
import {
  validateGeminiResult,
  countVpdSections,
} from "./validateGeminiResult";
import type { TubeWatchAnalysisResult } from "@/lib/ai/getGeminiConfig";

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function makeValidResult(overrides: Partial<TubeWatchAnalysisResult> = {}): TubeWatchAnalysisResult {
  return {
    version: "1",
    channel_summary: "히시월드 채널은 이색적인 주거 체험 콘텐츠를 제공합니다.",
    content_pattern_summary: "단편 브이로그 위주",
    content_patterns: ["이색 주거 체험 콘텐츠", "단기 체험 형식"],
    target_audience: ["20대 직장인", "여행 관심층"],
    strengths: ["독특한 소재", "높은 조회수"],
    weaknesses: ["낮은 업로드 빈도", "댓글 참여율 저조"],
    bottlenecks: ["주제 다양성 부족"],
    recommended_topics: ["도심 속 숨겨진 공간", "해외 이색 주거"],
    growth_action_plan: ["썸네일 A/B 테스트", "주 1회 업로드 유지", "커뮤니티 탭 활성화"],
    analysis_confidence: "high",
    interpretation_mode: "full",
    sample_size_note: "50개 영상 기준",
    next_trend_plan: {
      topic: "도심 속 숨겨진 동네",
      why_this_topic: "기존 이색 주거 영상이 높은 조회수를 기록했습니다.",
      pain_point: "시청자들이 새로운 공간을 발견하고 싶어합니다.",
      content_angle: "현지인만 아는 숨겨진 동네 탐방",
      opening_hook: "여러분, 이 동네 아세요?",
      title_candidates: ["아무도 모르는 서울의 숨겨진 동네", "현지인만 아는 그곳", "서울에 이런 곳이?"],
      recommended_tags: ["이색동네", "서울숨겨진곳", "도심탐방"],
      script_outline: "",
      thumbnail_direction: "",
      content_plan: "",
      exit_prevention: "",
      expected_reaction: "",
      viewing_points: { popularity: 4, expertise: 3, stimulation: 5, informativeness: 4, fan_service: 4 },
      video_plan_document: [
        "## 1. 기획 의도 (The Logic)\n내용1",
        "## 2. 킬러 타이틀 & 썸네일 (The Hook)\n내용2",
        "## 3. 인트로 30초 설계 (The Retention)\n내용3",
        "## 4. 메인 콘텐츠 구성 (The Body)\n내용4",
        "## 5. 시청자 결핍 & SEO (The Value)\n내용5",
        "## 6. 예상 시청자 반응 (The Outcome)\n내용6",
      ].join("\n\n"),
      execution_hint_document: "## 제목 후보\n제목들\n\n## 훅 설계\n훅\n\n## 썸네일 방향\n썸네일",
    },
    channel_dna_narrative: null,
    action_execution_hints: null,
    ...overrides,
  };
}

// ── countVpdSections ──────────────────────────────────────────────────────────

describe("countVpdSections", () => {
  it("6개 ## 섹션 → 6 반환", () => {
    const vpd = [
      "## 1. 기획 의도\n내용",
      "## 2. 타이틀\n내용",
      "## 3. 인트로\n내용",
      "## 4. 본문\n내용",
      "## 5. SEO\n내용",
      "## 6. 반응\n내용",
    ].join("\n\n");
    expect(countVpdSections(vpd)).toBe(6);
  });

  it("3개 섹션 → 3 반환", () => {
    const vpd = "## 1. 기획\n내용\n\n## 2. 타이틀\n내용\n\n## 3. 인트로\n내용";
    expect(countVpdSections(vpd)).toBe(3);
  });

  it("빈 문자열 → 0 반환", () => {
    expect(countVpdSections("")).toBe(0);
  });

  it("## 가 줄 중간에 있으면 카운트 안 됨", () => {
    const vpd = "앞 내용 ## 이건 아님\n## 1. 이건 맞음\n내용";
    expect(countVpdSections(vpd)).toBe(1);
  });
});

// ── validateGeminiResult ──────────────────────────────────────────────────────

describe("validateGeminiResult", () => {
  it("완전한 결과 → valid: true", () => {
    const result = validateGeminiResult(makeValidResult());
    expect(result.valid).toBe(true);
  });

  it("channel_summary 너무 짧으면 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({ channel_summary: "짧음" }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.issues.some((i) => i.field === "channel_summary")).toBe(true);
  });

  it("channel_summary 비어있으면 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({ channel_summary: "" }));
    expect(result.valid).toBe(false);
  });

  it("content_patterns 1개 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({ content_patterns: ["하나만"] }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.issues.some((i) => i.field === "content_patterns")).toBe(true);
  });

  it("growth_action_plan 2개 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({ growth_action_plan: ["하나", "둘"] }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.issues.some((i) => i.field === "growth_action_plan")).toBe(true);
  });

  it("strengths 1개 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({ strengths: ["하나"] }));
    expect(result.valid).toBe(false);
  });

  it("weaknesses 1개 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({ weaknesses: ["하나"] }));
    expect(result.valid).toBe(false);
  });

  it("next_trend_plan.video_plan_document 섹션 3개 → invalid", () => {
    const result = validateGeminiResult(makeValidResult({
      next_trend_plan: {
        ...makeValidResult().next_trend_plan!,
        video_plan_document: "## 1. 기획\n내용\n\n## 2. 타이틀\n내용\n\n## 3. 인트로\n내용",
      },
    }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.field === "next_trend_plan.video_plan_document")).toBe(true);
    }
  });

  it("next_trend_plan이 null이면 vpd 검증 건너뜀 → 다른 필드만 검증", () => {
    const result = validateGeminiResult(makeValidResult({ next_trend_plan: null }));
    // next_trend_plan null 자체는 오류가 아님 (delta run 등에서 허용)
    expect(result.valid).toBe(true);
  });

  it("여러 필드 동시 오류 → issues 배열에 모두 포함", () => {
    const result = validateGeminiResult(makeValidResult({
      channel_summary: "짧",
      content_patterns: ["하나"],
      growth_action_plan: ["하나", "둘"],
    }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.issues.length).toBeGreaterThanOrEqual(3);
  });
});
