/**
 * parseSectionScores — 공유 유틸
 *
 * feature_section_scores / section_scores 컬럼 raw 값을 정규화된 구조체로 변환한다.
 *
 * [수정 이력]
 * - camelCase 전용 → camelCase + snake_case 양방향 지원
 *   이유: 과거 DB 레코드 중 일부가 snake_case 키
 *   (channel_activity, audience_response, content_structure,
 *    seo_optimization, growth_momentum)로 저장되어 있어
 *   parseSectionScores()가 null을 반환, ScoreBar / radarProfile 미렌더.
 *   camelCase 우선, snake_case fallback으로 양쪽 모두 흡수.
 */

export type NormalizedSectionScores = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
};

/** camelCase 키와 그에 대응하는 snake_case 키 쌍 */
const KEY_MAP: Array<{ camel: keyof NormalizedSectionScores; snake: string }> = [
  { camel: "channelActivity",  snake: "channel_activity"  },
  { camel: "audienceResponse", snake: "audience_response" },
  { camel: "contentStructure", snake: "content_structure" },
  { camel: "seoOptimization",  snake: "seo_optimization"  },
  { camel: "growthMomentum",   snake: "growth_momentum"   },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * camelCase / snake_case 양방향으로 섹션 점수를 파싱한다.
 * 모든 키가 없으면 null 반환.
 */
export function parseSectionScores(raw: unknown): NormalizedSectionScores | null {
  if (!isRecord(raw)) return null;

  const out: Partial<NormalizedSectionScores> = {};
  for (const { camel, snake } of KEY_MAP) {
    // camelCase 우선, 없으면 snake_case fallback
    const v = raw[camel] ?? raw[snake];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[camel] = Math.max(0, Math.min(100, v));
    }
  }

  if (
    out.channelActivity == null &&
    out.audienceResponse == null &&
    out.contentStructure == null &&
    out.seoOptimization == null &&
    out.growthMomentum == null
  ) {
    return null;
  }

  return {
    channelActivity:  out.channelActivity  ?? 0,
    audienceResponse: out.audienceResponse ?? 0,
    contentStructure: out.contentStructure ?? 0,
    seoOptimization:  out.seoOptimization  ?? 0,
    growthMomentum:   out.growthMomentum   ?? 0,
  };
}
