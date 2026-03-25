import type {
  SeoLabCardItem,
  SeoLabResultRow,
} from "@/components/seo-lab/types";

const CARD_TITLES: [string, string, string] = [
  "제목/썸네일 훅",
  "설명/메타데이터",
  "태그 활용",
];

/**
 * ChannelDnaRadar과 동일한 보간 로직으로 0~100 점수 계산.
 */
function interpolate(value: number, breakpoints: [number, number][]): number {
  if (breakpoints.length === 0) return 0;
  if (value <= breakpoints[0][0]) return breakpoints[0][1];
  for (let i = 1; i < breakpoints.length; i++) {
    const [x0, y0] = breakpoints[i - 1];
    const [x1, y1] = breakpoints[i];
    if (value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return Math.max(0, Math.min(100, y0 + t * (y1 - y0)));
    }
  }
  return Math.min(100, breakpoints[breakpoints.length - 1][1]);
}

type AxisKey =
  | "avgViewCount"
  | "avgLikeRatio"
  | "avgCommentRatio"
  | "recent30dUploadCount"
  | "avgTagCount";

function extractMetrics(
  snapshot: Record<string, unknown> | null
): Record<AxisKey, number> | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = snapshot.metrics;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const keys: AxisKey[] = [
    "avgViewCount",
    "avgLikeRatio",
    "avgCommentRatio",
    "recent30dUploadCount",
    "avgTagCount",
  ];
  const hasAny = keys.some((k) => typeof m[k] === "number");
  if (!hasAny) return null;
  const out: Record<string, number> = {};
  for (const k of keys) {
    out[k] = typeof m[k] === "number" ? (m[k] as number) : 0;
  }
  return out as Record<AxisKey, number>;
}

function safeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

/** seo 관련 필드에서 문자열 1개 추출 (객체/배열/문자열) */
function extractFirstLine(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string" && first.trim().length > 0) return first.trim();
    if (first && typeof first === "object" && "text" in first && typeof (first as { text: unknown }).text === "string") {
      return ((first as { text: string }).text).trim();
    }
  }
  if (typeof value === "object" && value !== null && "recommendation" in value) {
    const r = (value as { recommendation: unknown }).recommendation;
    if (typeof r === "string" && r.trim().length > 0) return r.trim();
  }
  return null;
}

/**
 * analysis_results 한 건에서 SEO 개선 카드 3개를 생성합니다.
 * A) seo/title_insights/metadata_insights/tags_insights 등 실제 필드 우선
 * B) weaknesses / bottlenecks / feature_snapshot / feature_section_scores 기반 fallback
 * C) 없으면 기본 문구
 */
export function buildSeoLabItemsFromResult(
  row: SeoLabResultRow | null
): SeoLabCardItem[] {
  const cards: SeoLabCardItem[] = [];
  const raw = row as Record<string, unknown> | null;

  if (!row) {
    return [
      {
        title: CARD_TITLES[0],
        current_status: "표본 평균 조회 대비 정규화 점수가 낮게 읽힘(내부 스냅샷)",
        recommendation: "대표 영상 제목 구조 재정의",
        source: "fallback",
      },
      {
        title: CARD_TITLES[1],
        current_status: "최근 활동성 점수 낮음",
        recommendation: "최근 업로드 기준 메타데이터 정비",
        source: "fallback",
      },
      {
        title: CARD_TITLES[2],
        current_status: "SEO 태그 활용 점수 낮음",
        recommendation: "태그·키워드 체계 정리",
        source: "fallback",
      },
    ];
  }

  const metrics = extractMetrics(row.feature_snapshot);
  const seoScore =
    row.feature_section_scores && typeof row.feature_section_scores.seoOptimization === "number"
      ? row.feature_section_scores.seoOptimization
      : null;

  const weak = safeStringArray(row.weaknesses);
  const bottle = safeStringArray(row.bottlenecks);
  const evidenceLines = [...weak, ...bottle];

  // 카드 0: 제목/썸네일 훅
  const titleInsights = raw ? extractFirstLine(raw.title_insights) : null;
  if (titleInsights) {
    cards.push({
      title: CARD_TITLES[0],
      current_status: titleInsights.slice(0, 80) + (titleInsights.length > 80 ? "…" : ""),
      recommendation: titleInsights,
      source: "title_insights",
    });
  } else if (metrics) {
    const viewScore = interpolate(metrics.avgViewCount, [[0, 0], [1000, 40], [5000, 70], [10000, 100]]);
    const likeScore = interpolate(metrics.avgLikeRatio, [[0, 0], [0.03, 60], [0.06, 100]]);
    if (viewScore < 70) {
      cards.push({
        title: CARD_TITLES[0],
        current_status: "표본 평균 조회 대비 정규화 점수가 낮게 읽힘(내부 스냅샷)",
        recommendation: "대표 영상 제목 구조 재정의",
        source: "low_score_section",
      });
    } else if (likeScore < 70) {
      cards.push({
        title: CARD_TITLES[0],
        current_status: "좋아요 반응 낮음",
        recommendation: "썸네일·제목 조합 A/B 실험",
        source: "low_score_section",
      });
    } else if (evidenceLines.length > 0) {
      cards.push({
        title: CARD_TITLES[0],
        current_status: evidenceLines[0].slice(0, 60) + (evidenceLines[0].length > 60 ? "…" : ""),
        recommendation: "대표 영상 제목 구조 재정의",
        source: "weaknesses_bottlenecks",
      });
    } else {
      cards.push({
        title: CARD_TITLES[0],
        current_status: "—",
        recommendation: "대표 영상 제목 구조 재정의",
        source: "fallback",
      });
    }
  } else {
    cards.push({
      title: CARD_TITLES[0],
      current_status: "—",
      recommendation: "대표 영상 제목 구조 재정의",
      source: "fallback",
    });
  }

  // 카드 1: 설명/메타데이터
  const metadataInsights = raw ? extractFirstLine(raw.metadata_insights) : null;
  if (metadataInsights) {
    cards.push({
      title: CARD_TITLES[1],
      current_status: metadataInsights.slice(0, 80) + (metadataInsights.length > 80 ? "…" : ""),
      recommendation: metadataInsights,
      source: "metadata_insights",
    });
  } else if (metrics) {
    const commentScore = interpolate(metrics.avgCommentRatio, [[0, 0], [0.005, 60], [0.01, 100]]);
    const activityScore = interpolate(metrics.recent30dUploadCount, [[0, 0], [4, 50], [8, 80], [12, 100]]);
    if (commentScore < 60) {
      cards.push({
        title: CARD_TITLES[1],
        current_status: "댓글 참여도 낮음",
        recommendation: "질문형 설명문/고정댓글 CTA 보강",
        source: "low_score_section",
      });
    } else if (activityScore < 70) {
      cards.push({
        title: CARD_TITLES[1],
        current_status: "최근 활동성 점수 낮음",
        recommendation: "최근 업로드 기준 메타데이터 정비",
        source: "low_score_section",
      });
    } else if (evidenceLines.length > 1) {
      cards.push({
        title: CARD_TITLES[1],
        current_status: evidenceLines[1].slice(0, 60) + (evidenceLines[1].length > 60 ? "…" : ""),
        recommendation: "질문형 설명문/고정댓글 CTA 보강",
        source: "weaknesses_bottlenecks",
      });
    } else {
      cards.push({
        title: CARD_TITLES[1],
        current_status: "—",
        recommendation: "최근 업로드 기준 메타데이터 정비",
        source: "fallback",
      });
    }
  } else {
    cards.push({
      title: CARD_TITLES[1],
      current_status: "—",
      recommendation: "최근 업로드 기준 메타데이터 정비",
      source: "fallback",
    });
  }

  // 카드 2: 태그 활용
  const tagsInsights = raw ? extractFirstLine(raw.tags_insights) ?? extractFirstLine(raw.seo_insights) : null;
  if (tagsInsights) {
    cards.push({
      title: CARD_TITLES[2],
      current_status: tagsInsights.slice(0, 80) + (tagsInsights.length > 80 ? "…" : ""),
      recommendation: tagsInsights,
      source: "tags_insights",
    });
  } else if (metrics || seoScore !== null) {
    const tagScore = metrics
      ? interpolate(metrics.avgTagCount, [[0, 0], [5, 60], [10, 100]])
      : 50;
    const lowTag = tagScore < 60;
    const lowSeo = seoScore !== null && seoScore < 60;
    if (lowTag || lowSeo) {
      cards.push({
        title: CARD_TITLES[2],
        current_status: lowTag ? "SEO 태그 활용 점수 낮음" : "낮은 태그 활용 패턴 감지",
        recommendation: "핵심 키워드 기반 태그 재정비",
        source: "low_score_section",
      });
    } else if (evidenceLines.length > 2) {
      cards.push({
        title: CARD_TITLES[2],
        current_status: evidenceLines[2].slice(0, 60) + (evidenceLines[2].length > 60 ? "…" : ""),
        recommendation: "태그·키워드 체계 정리",
        source: "weaknesses_bottlenecks",
      });
    } else {
      cards.push({
        title: CARD_TITLES[2],
        current_status: "—",
        recommendation: "태그·키워드 체계 정리",
        source: "fallback",
      });
    }
  } else {
    cards.push({
      title: CARD_TITLES[2],
      current_status: "SEO 태그 활용 점수 낮음",
      recommendation: "태그·키워드 체계 정리",
      source: "fallback",
    });
  }

  return cards;
}
