// src/lib/ai/getGeminiConfig.ts

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
          description: "분석 스키마 버전. 예: 1.0",
        },
        channel_summary: {
          type: "string",
          description:
            "채널의 현재 상태를 2~3문장으로 요약. 과장 금지. 데이터가 부족하면 보수적으로 서술",
        },
        content_pattern_summary: {
          type: "string",
          description:
            "최근 콘텐츠 흐름을 1~2문장으로 요약. 확정적 표현보다 관찰 기반 표현 사용",
        },
        content_patterns: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "반복적으로 보이는 콘텐츠 패턴. 각 항목은 짧고 완결된 문장",
        },
        target_audience: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "현재 콘텐츠를 실제로 선호할 가능성이 높은 시청자군. 추상적 표현 금지",
        },
        strengths: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "데이터상 확인 가능한 강점만 작성. 근거가 약하면 강점으로 쓰지 말 것",
        },
        weaknesses: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "현재 성장 저해 요소. 회피 표현 없이 구체적으로 작성",
        },
        bottlenecks: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "성장 병목 요인. 약점보다 조금 더 구조적 관점으로 작성",
        },
        recommended_topics: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description:
            "다음 콘텐츠 기획 후보 주제. 현재 채널 규모와 맥락에 맞게 현실적으로 작성",
        },
        growth_action_plan: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
          description:
            "바로 실행 가능한 액션 플랜. 추상적 조언보다 실행 문장 우선",
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
            "표본 수나 데이터 한계에 대한 설명. 데이터가 충분하지 않으면 반드시 제한점을 명시",
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
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema,
      },
    };
  }