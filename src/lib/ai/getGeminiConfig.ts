// src/lib/ai/getGeminiConfig.ts

export type NextTrendAIPlan = {
  topic: string;              // 다음 영상 주제 핵심 (20자 이내 짧은 구)
  why_this_topic: string;     // 왜 이 주제인가 (2~3문장, 메트릭 인용)
  pain_point: string;         // 시청자 pain point (1~2문장)
  content_angle: string;      // 차별화 접근 각도 (1문장)
  opening_hook: string;       // 오프닝 훅 방향 (1문장)
  title_candidates: string[]; // 제목 후보 3개 (각 30자 이내)
  recommended_tags: string[]; // 추천 태그 5~8개
  script_outline: string;     // 대본 구조 (섹션별 소제목+핵심내용 한 줄)
  thumbnail_direction: string; // 썸네일 구도·텍스트·색상 방향 (2~3문장)
  content_plan: string;        // 제작 팁 3가지 (번호 목록)
  exit_prevention: string;     // 이탈 방지 포인트 2~3가지
  expected_reaction: string;   // 업로드 후 48시간 체크포인트
  viewing_points: {            // 시청 포인트 게이지 (1~5 정수)
    popularity: number;        // 대중성
    expertise: number;         // 전문성
    stimulation: number;       // 자극도
    informativeness: number;   // 정보성
    fan_service: number;       // 팬서비스
  };
  video_plan_document: string; // 전략 리포트 전문 (마크다운, 채널 데이터 인용 필수)
  execution_hint_document: string; // 제목·훅·썸네일 통합 원페이퍼 (마크다운, 300자 내외)
};

export type ActionExecutionHint = {
  action: string;          // growth_action_plan 항목 원문
  execution_hint: string;  // 구체적 실행 방법 (1~2문장)
  expected_effect: string; // 기대 효과 (1문장)
};

export type TubeWatchAnalysisResult = {
    version: string;
    channel_summary: string;
    content_pattern_summary: string;
    content_patterns: string[];
    target_audience: string[];
    strengths: string[];
    weaknesses: string[];
    bottlenecks: string[];
    recommended_topics: string[];
    growth_action_plan: string[];
    analysis_confidence: "low" | "medium" | "high";
    interpretation_mode: string;
    sample_size_note: string;
    // 페이지별 AI 생성 콘텐츠 (optional — 구버전 분석 호환)
    next_trend_plan: NextTrendAIPlan | null;
    channel_dna_narrative: string | null;
    action_execution_hints: ActionExecutionHint[] | null;
  };
  
  export function getGeminiConfig() {
    const apiKey = process.env.GEMINI_API_KEY;
  
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    }
  
    const model = "gemini-2.5-flash";
  
    const responseSchema = {
      type: "object",
      required: [
        "version",
        "channel_summary",
        "content_pattern_summary",
        "content_patterns",
        "target_audience",
        "strengths",
        "weaknesses",
        "bottlenecks",
        "recommended_topics",
        "growth_action_plan",
        "analysis_confidence",
        "interpretation_mode",
        "sample_size_note",
      ],
      properties: {
        version: {
          type: "string",
          description: "분석 스키마 버전. 항상 1.0을 반환",
        },
        channel_summary: {
          type: "string",
          description:
            "채널의 현재 상태를 2~3문장으로 요약. 메트릭 수치를 구체적으로 인용. 과장 금지. 데이터가 부족하면 보수적으로 서술. 200자 이내.",
        },
        content_pattern_summary: {
          type: "string",
          description:
            "최근 콘텐츠 흐름을 1~2문장으로 요약. 확정적 표현보다 관찰 기반 표현 사용. 150자 이내.",
        },
        content_patterns: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "반복적으로 보이는 콘텐츠 패턴. 각 항목은 번호나 기호 없이 한 문장(120자 이내)으로 작성. 메트릭 수치를 인용할 것",
        },
        target_audience: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "현재 콘텐츠를 실제로 선호할 가능성이 높은 시청자군. 각 항목은 번호나 기호 없이 한 문장(120자 이내)으로 작성",
        },
        strengths: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "데이터상 확인 가능한 강점만 작성. 각 항목은 번호나 기호 없이 한 문장(120자 이내). 메트릭 수치를 인용할 것",
        },
        weaknesses: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "현재 성장 저해 요소. 각 항목은 번호나 기호 없이 한 문장(120자 이내). 메트릭 수치를 인용하여 구체적으로 작성",
        },
        bottlenecks: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: { type: "string" },
          description:
            "성장 병목 요인. 약점보다 구조적 관점으로 작성. 각 항목은 번호나 기호 없이 한 문장(120자 이내)",
        },
        recommended_topics: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "다음 콘텐츠 기획 후보 주제. 각 항목은 번호나 기호 없이 한 문장(120자 이내). 현재 채널 규모와 맥락에 맞게 현실적으로 작성",
        },
        growth_action_plan: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
          description:
            "바로 실행 가능한 액션 플랜. 각 항목은 번호나 기호 없이 한 문장(120자 이내). 추상적 조언 금지, 실행 문장으로 작성",
        },
        analysis_confidence: {
          type: "string",
          enum: ["low", "medium", "high"],
          description:
            "데이터 신뢰도. 표본이 적거나 신호가 약하면 반드시 low 또는 medium",
        },
        interpretation_mode: {
          type: "string",
          description:
            "해석 방식 설명자. 기본값은 early_stage_signal_based 권장",
        },
        sample_size_note: {
          type: "string",
          description:
            "표본 수나 데이터 한계에 대한 설명. 데이터가 충분하지 않으면 반드시 제한점을 명시. 100자 이내.",
        },
      },
    };

    return {
      apiKey,
      model,
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      generationConfig: {
        temperature: 0.2,
        topK: 24,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema,
      },
    };
  }

// next_trend_plan 전용 스키마 — generateNextTrendPlan.ts에서 사용
export const NEXT_TREND_PLAN_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string", description: "다음 영상 주제 핵심. 20자 이내 짧은 구. 긴 문장 금지." },
    why_this_topic: { type: "string", description: "왜 이 주제가 이 채널에 맞는지 2~3문장. 메트릭 수치 인용 필수." },
    pain_point: { type: "string", description: "이 영상이 해소할 시청자의 핵심 불편·궁금증 1~2문장." },
    content_angle: { type: "string", description: "경쟁 채널과 차별화되는 접근 각도 1문장." },
    opening_hook: { type: "string", description: "처음 15초 안에 시청자를 잡을 오프닝 방향 1문장. 실제 대사 형태 권장." },
    title_candidates: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" }, description: "제목 후보 3개. 각 30자 이내. 번호·기호 없이 제목만." },
    recommended_tags: { type: "array", minItems: 5, maxItems: 8, items: { type: "string" }, description: "SEO 태그 5~8개." },
    viewing_points: {
      type: "object",
      properties: {
        popularity:      { type: "integer", minimum: 1, maximum: 5, description: "대중성" },
        expertise:       { type: "integer", minimum: 1, maximum: 5, description: "전문성" },
        stimulation:     { type: "integer", minimum: 1, maximum: 5, description: "자극도" },
        informativeness: { type: "integer", minimum: 1, maximum: 5, description: "정보성" },
        fan_service:     { type: "integer", minimum: 1, maximum: 5, description: "팬서비스" },
      },
      required: ["popularity", "expertise", "stimulation", "informativeness", "fan_service"],
    },
    vpd_sec1: { type: "string", description: "## 1. 기획 의도 (The Logic) — 채널 메트릭·수치 인용. 소제목 ### 사용. 300자 이내. 빈 문자열 금지." },
    vpd_sec2: { type: "string", description: "## 2. 킬러 타이틀 & 썸네일 (The Hook) — 제목 3개 번호 리스트 + 썸네일 전략. 소제목 ### 사용. 300자 이내. 빈 문자열 금지." },
    vpd_sec3: { type: "string", description: "## 3. 인트로 30초 설계 (The Retention) — 타임스탬프별 장면·대사. 300자 이내. 빈 문자열 금지." },
    vpd_sec4: { type: "string", description: "## 4. 메인 콘텐츠 구성 (The Body) — Chapter 2~3개. 300자 이내. 빈 문자열 금지." },
    vpd_sec5: { type: "string", description: "## 5. 시청자 결핍 & SEO (The Value) — 니즈 서술 + #태그. 300자 이내. 빈 문자열 금지." },
    vpd_sec6: { type: "string", description: "## 6. 예상 시청자 반응 (The Outcome) — 예상 댓글 2개·조회수 범위·48h 체크포인트. 300자 이내. 빈 문자열 금지." },
    execution_hint_document: { type: "string", description: "제목·훅·썸네일 실행 힌트 원페이퍼. 3섹션(## 제목 후보 / ## 훅 설계 / ## 썸네일 방향). 300자 이내. 빈 문자열 금지." },
  },
  required: ["topic", "why_this_topic", "pain_point", "content_angle", "opening_hook", "title_candidates", "recommended_tags", "viewing_points", "vpd_sec1", "vpd_sec2", "vpd_sec3", "vpd_sec4", "vpd_sec5", "vpd_sec6", "execution_hint_document"],
};