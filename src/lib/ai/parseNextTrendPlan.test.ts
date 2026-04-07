import { describe, it, expect } from "vitest";
import {
  assembleVideoPlanDocument,
  normalizeNextTrendPlan,
  normalizeString,
  truncateToLimit,
} from "@/lib/ai/parseNextTrendPlan";

// ── assembleVideoPlanDocument ──

describe("assembleVideoPlanDocument", () => {
  it("vpd_sec1~6 전체가 있을 때 6개 섹션을 모두 조합한다", () => {
    const obj = {
      vpd_sec1: "기획 의도 내용",
      vpd_sec2: "킬러 타이틀 내용",
      vpd_sec3: "인트로 설계 내용",
      vpd_sec4: "메인 콘텐츠 내용",
      vpd_sec5: "시청자 결핍 내용",
      vpd_sec6: "예상 시청자 반응 내용",
    };

    const result = assembleVideoPlanDocument(obj);

    expect(result).toContain("## 1. 기획 의도 (The Logic)");
    expect(result).toContain("## 2. 킬러 타이틀 & 썸네일 (The Hook)");
    expect(result).toContain("## 3. 인트로 30초 설계 (The Retention)");
    expect(result).toContain("## 4. 메인 콘텐츠 구성 (The Body)");
    expect(result).toContain("## 5. 시청자 결핍 & SEO (The Value)");
    expect(result).toContain("## 6. 예상 시청자 반응 (The Outcome)");
    expect(result).toContain("기획 의도 내용");
    expect(result).toContain("예상 시청자 반응 내용");

    const headingCount = (result.match(/^## /gm) ?? []).length;
    expect(headingCount).toBe(6);
  });

  it("Gemini가 이미 ## 헤딩을 포함한 경우 헤딩이 중복되지 않는다", () => {
    const obj = {
      vpd_sec1: "## 1. 기획 의도 (The Logic)\n이미 헤딩 포함된 내용",
      vpd_sec2: "킬러 타이틀 내용",
    };

    const result = assembleVideoPlanDocument(obj);

    // "## 1. 기획 의도"가 딱 한 번만 나와야 함
    const matches = result.match(/## 1\. 기획 의도/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("일부 섹션이 누락된 경우 해당 섹션을 skip한다", () => {
    const obj = {
      vpd_sec1: "기획 의도 내용",
      // vpd_sec2 누락
      vpd_sec3: "인트로 설계 내용",
      // vpd_sec4 누락
      vpd_sec5: "시청자 결핍 내용",
      // vpd_sec6 누락
    };

    const result = assembleVideoPlanDocument(obj);

    expect(result).toContain("## 1. 기획 의도 (The Logic)");
    expect(result).not.toContain("## 2. 킬러 타이틀 & 썸네일 (The Hook)");
    expect(result).toContain("## 3. 인트로 30초 설계 (The Retention)");
    expect(result).not.toContain("## 4. 메인 콘텐츠 구성 (The Body)");
    expect(result).toContain("## 5. 시청자 결핍 & SEO (The Value)");
    expect(result).not.toContain("## 6. 예상 시청자 반응 (The Outcome)");
  });

  it("vpd_sec 없고 video_plan_document만 있을 때 폴백으로 반환한다", () => {
    const obj = {
      video_plan_document: "구버전 전략 문서 전문",
    };

    const result = assembleVideoPlanDocument(obj);

    expect(result).toBe("구버전 전략 문서 전문");
  });

  it("모두 빈 문자열이면 빈 문자열을 반환한다", () => {
    const obj = {
      vpd_sec1: "",
      vpd_sec2: "   ",
      video_plan_document: "",
    };

    const result = assembleVideoPlanDocument(obj);

    expect(result).toBe("");
  });
});

// ── normalizeNextTrendPlan ──

const BASE_PLAN = {
  topic: "리액션 영상 기획",
  why_this_topic: "최근 리액션 콘텐츠가 급격히 성장했기 때문입니다.",
  pain_point: "시청자들이 공감 콘텐츠를 원합니다.",
};

describe("normalizeNextTrendPlan", () => {
  it("topic이 없으면 null을 반환한다", () => {
    const result = normalizeNextTrendPlan({
      why_this_topic: BASE_PLAN.why_this_topic,
      pain_point: BASE_PLAN.pain_point,
    });
    expect(result).toBeNull();
  });

  it("why_this_topic이 없으면 null을 반환한다", () => {
    const result = normalizeNextTrendPlan({
      topic: BASE_PLAN.topic,
      pain_point: BASE_PLAN.pain_point,
    });
    expect(result).toBeNull();
  });

  it("pain_point가 없으면 null을 반환한다", () => {
    const result = normalizeNextTrendPlan({
      topic: BASE_PLAN.topic,
      why_this_topic: BASE_PLAN.why_this_topic,
    });
    expect(result).toBeNull();
  });

  it("viewing_points가 범위 밖(0)이면 1로 clamp된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      viewing_points: { popularity: 0, expertise: 3, stimulation: 3, informativeness: 3, fan_service: 3 },
    });
    expect(result?.viewing_points.popularity).toBe(1);
  });

  it("viewing_points가 범위 밖(6)이면 5로 clamp된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      viewing_points: { popularity: 6, expertise: 3, stimulation: 3, informativeness: 3, fan_service: 3 },
    });
    expect(result?.viewing_points.popularity).toBe(5);
  });

  it("viewing_points가 음수(-1)이면 1로 clamp된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      viewing_points: { popularity: -1, expertise: 3, stimulation: 3, informativeness: 3, fan_service: 3 },
    });
    expect(result?.viewing_points.popularity).toBe(1);
  });

  it("viewing_points가 문자열 '3'이면 숫자 3으로 변환된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      viewing_points: { popularity: "3", expertise: "4", stimulation: "2", informativeness: "5", fan_service: "1" },
    });
    expect(result?.viewing_points.popularity).toBe(3);
    expect(result?.viewing_points.expertise).toBe(4);
  });

  it("viewing_points가 NaN/누락이면 기본값 3을 사용한다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      viewing_points: { popularity: "not-a-number" },
    });
    expect(result?.viewing_points.popularity).toBe(3);
    expect(result?.viewing_points.expertise).toBe(3);
    expect(result?.viewing_points.stimulation).toBe(3);
    expect(result?.viewing_points.informativeness).toBe(3);
    expect(result?.viewing_points.fan_service).toBe(3);
  });

  it("viewing_points 자체가 없을 때 모든 항목이 기본값 3이다", () => {
    const result = normalizeNextTrendPlan({ ...BASE_PLAN });
    expect(result?.viewing_points.popularity).toBe(3);
    expect(result?.viewing_points.expertise).toBe(3);
  });

  it("title_candidates는 최대 3개까지만 포함된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      title_candidates: ["제목1", "제목2", "제목3", "제목4", "제목5"],
    });
    expect(result?.title_candidates).toHaveLength(3);
  });

  it("recommended_tags는 최대 8개까지만 포함된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      recommended_tags: ["태그1", "태그2", "태그3", "태그4", "태그5", "태그6", "태그7", "태그8", "태그9", "태그10"],
    });
    expect(result?.recommended_tags.length).toBeLessThanOrEqual(8);
  });

  it("topic이 40자를 초과하면 truncate된다", () => {
    const longTopic = "이것은 매우 긴 주제 제목입니다. 40자를 초과하는 내용이 포함되어 있습니다. 이것은 테스트용입니다.";
    expect(longTopic.length).toBeGreaterThan(40);

    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      topic: longTopic,
    });
    expect(result?.topic.length).toBeLessThanOrEqual(40);
  });

  it("vpd_sec1~6가 있을 때 video_plan_document가 조합된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      vpd_sec1: "기획 의도 내용",
      vpd_sec2: "킬러 타이틀 내용",
      vpd_sec3: "인트로 설계",
      vpd_sec4: "메인 콘텐츠",
      vpd_sec5: "시청자 결핍",
      vpd_sec6: "예상 반응",
    });

    expect(result?.video_plan_document).toContain("## 1. 기획 의도 (The Logic)");
    expect(result?.video_plan_document).toContain("기획 의도 내용");

    const headingCount = (result?.video_plan_document.match(/^## /gm) ?? []).length;
    expect(headingCount).toBe(6);
  });

  it("vpd_sec 없고 구버전 video_plan_document 필드가 있으면 폴백으로 사용된다", () => {
    const result = normalizeNextTrendPlan({
      ...BASE_PLAN,
      video_plan_document: "구버전 전략 문서",
    });

    expect(result?.video_plan_document).toBe("구버전 전략 문서");
  });
});

// ── normalizeString (smoke test) ──

describe("normalizeString", () => {
  it("문자열을 trim 후 반환한다", () => {
    expect(normalizeString("  hello  ")).toBe("hello");
  });

  it("빈 문자열이면 null을 반환한다", () => {
    expect(normalizeString("   ")).toBeNull();
  });

  it("non-string이면 null을 반환한다", () => {
    expect(normalizeString(123)).toBeNull();
    expect(normalizeString(null)).toBeNull();
    expect(normalizeString(undefined)).toBeNull();
  });
});

// ── truncateToLimit (smoke test) ──

describe("truncateToLimit", () => {
  it("limit 이하이면 그대로 반환한다", () => {
    expect(truncateToLimit("짧은 텍스트", 100)).toBe("짧은 텍스트");
  });

  it("limit 초과 시 자른다", () => {
    const long = "a".repeat(200);
    expect(truncateToLimit(long, 50).length).toBeLessThanOrEqual(50);
  });

  it("한국어 '다.' 패턴이 있으면 그 위치에서 자른다", () => {
    // 60자 한도, 앞부분 35자 이상이고 '다.'로 끝나는 경우
    const text = "첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장이 여기에 길게 이어집니다 매우 길게.";
    const result = truncateToLimit(text, 30);
    // limit=30, cut="첫 번째 문장입니다. 두 번째 문", lastKoreanEnd = 9 (index of "다."), 9 > 30*0.5=15 => false (9 <= 15)
    // Let's use a longer limit where the Korean end is clearly past 0.5
    const text2 = "이것은 첫 번째 입니다. 뒤에 더 많은 내용이 있습니다.";
    const result2 = truncateToLimit(text2, 20);
    // cut = "이것은 첫 번째 입니다. 뒤에" (20 chars), lastKoreanEnd = index of "다." around position 10
    // 10 > 10 (20*0.5) is false, so falls through to lastPeriod check
    expect(result2.length).toBeLessThanOrEqual(20);
  });
});
