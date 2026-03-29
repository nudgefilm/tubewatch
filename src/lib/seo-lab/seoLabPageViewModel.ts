/**
 * SEO Lab: `feature_snapshot`·구간 점수·패턴 + `buildInternalChannelDnaSummary`와 동일 범위의
 * 내부 신호로 채널 맞춤 SEO 전략 VM을 만든다.
 * 외부 SERP/검색볼륨은 `menuExtensionDataStrategy`의 `seo_lab.futureCollectionFields`에서 TODO.
 */
import type {
  AnalysisPageData,
  AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import { enrichRowScores } from "@/lib/server/analysis/mapAnalysisHistoryAndCompare";
import type { SeoLabMarketExtensionFieldsVm } from "@/lib/data/marketExtensionSlice";
import { buildSeoLabMarketExtensionSlice } from "@/lib/data/marketExtensionSlice";
import {
  deriveAnalysisRunsLoaded,
  deriveExtensionMenuFields,
} from "@/lib/analysis/analysisRun";
import { pickYoutubeAccessFieldsFromPageData } from "@/lib/analysis/pickYoutubeAccessFromPageData";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";
import type { AnalysisStatus } from "@/lib/analysis/types";
import { buildInternalChannelDnaSummary } from "@/lib/channel-dna/internalChannelDnaSummary";
import { buildSeoStrategySignals } from "@/lib/seo-lab/buildSeoStrategySignals";
import { buildSeoRecommendations } from "@/lib/seo-lab/buildSeoRecommendations";
import type { SeoStrategyItemVm } from "@/lib/seo-lab/seoLabStrategyTypes";
import type { StrategicCommentVm } from "@/lib/shared/strategicCommentTypes";
import { parseSectionScores } from "@/lib/analysis/engine/parseSectionScores";

export type SeoLabCheckCardVm = {
  id: string;
  itemName: string;
  currentState: string;
  whyCheck: string;
  improveDirection: string;
  hint: string;
};

export type SeoLabSummaryLineVm = {
  label: string;
  body: string;
};

export type SeoLabTitleSampleVm = {
  title: string;
  publishedAt: string | null;
  directionHint: string;
};

export type SeoLabPatternInsightVm = {
  id: string;
  title: string;
  description: string;
  tone: "neutral" | "caution";
};

export type SeoLabPageViewModel = {
  limitNotice: string | null;
  hasChannel: boolean;
  hasAnalysis: boolean;
  selectedChannelId: string | null;
  channelTitle: string | null;
  seoSectionScore: number | null;
  structureSectionScore: number | null;
  /** 채널 맞춤 SEO 전략(채널 DNA·스냅샷 내부 신호 기반, 검색량 없음) */
  seoStrategySummary: string;
  recommendedKeywordAngles: SeoStrategyItemVm[];
  recommendedTitlePatterns: SeoStrategyItemVm[];
  avoidKeywordAngles: SeoStrategyItemVm[];
  evidenceNotes: string[];
  hasEnoughSeoSignal: boolean;
  summaryLines: SeoLabSummaryLineVm[];
  checkCards: SeoLabCheckCardVm[];
  titleSamples: SeoLabTitleSampleVm[];
  patternInsights: SeoLabPatternInsightVm[];
  seoRelatedNotes: string[];
  sampleSizeNote: string | null;
  analysisConfidence: "low" | "medium" | "high" | null;
  /** 페이지 하단 전략 코멘트 카드 */
  strategicComment: StrategicCommentVm | null;
  menuStatus: AnalysisStatus;
  lastRunAt: string | null;
  analysisRunsLoaded: boolean;
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
};

type ChannelSectionScores = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
};

type MetricsPartial = Partial<Record<keyof ChannelMetrics, number>>;

type SnapshotVideo = {
  title: string;
  publishedAt: string | null;
};

const SEO_TEXT_KEYS = [
  "seo",
  "제목",
  "태그",
  "키워드",
  "검색",
  "메타",
  "설명",
  "description",
  "title",
  "tag",
  "thumbnail",
  "썸네일",
  "노출",
  "발견",
];

function isSeoRelatedText(text: string): boolean {
  const t = text.toLowerCase();
  return SEO_TEXT_KEYS.some((k) => t.includes(k.toLowerCase()));
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );
}

function uniqueTrimmed(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function extractMetricsFromSnapshot(snapshot: unknown): MetricsPartial | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }
  const raw = (snapshot as Record<string, unknown>).metrics;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as MetricsPartial;
}

function extractPatternFlags(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }
  const raw = (snapshot as Record<string, unknown>).patterns;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((x): x is string => typeof x === "string");
}

function parseVideosFromSnapshot(snapshot: unknown): SnapshotVideo[] {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }
  const obj = snapshot as Record<string, unknown>;
  const raw = obj.videos ?? obj.sample_videos;
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows: SnapshotVideo[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim() : "";
    if (!title) continue;
    const publishedAt =
      typeof r.publishedAt === "string"
        ? r.publishedAt
        : typeof r.published_at === "string"
          ? r.published_at
          : null;
    rows.push({ title, publishedAt });
  }
  return rows;
}

function hintForTitle(title: string, avgTitleLen: number | null): string {
  const len = title.length;
  if (avgTitleLen != null && Number.isFinite(avgTitleLen) && avgTitleLen > 0) {
    if (len < avgTitleLen * 0.65) {
      return `이 표본 제목(${len}자)은 스냅샷 평균 제목 길이(약 ${Math.round(avgTitleLen)}자)보다 짧습니다. 핵심 주제가 드러나는지 확인하세요. 예시 문구는 생성하지 않습니다.`;
    }
    if (len > avgTitleLen * 1.35) {
      return `이 표본 제목(${len}자)은 평균보다 깁니다. 앞부분에서 주제가 보이는지, 모바일에서 잘리는지 확인하세요. 대체 제목은 제안하지 않습니다.`;
    }
  }
  return "저장된 표본 제목입니다. 검색 의도·주제가 앞쪽에 드러나는지 검토하세요. 외부 검색량 데이터는 연동되어 있지 않습니다.";
}

const PATTERN_INSIGHTS: Record<
  string,
  { title: string; description: string; tone: "neutral" | "caution" }
> = {
  low_tag_usage: {
    title: "태그 사용량이 낮게 탐지됨",
    description:
      "스냅샷 패턴에 low_tag_usage가 포함되어 있습니다. 주제와 직접 연관된 태그를 빠짐없이 쓰는지, 불필요한 나열은 없는지 점검하세요.",
    tone: "caution",
  },
  repeated_topic_pattern: {
    title: "주제·포맷 반복 패턴",
    description:
      "repeated_topic_pattern 플래그가 있습니다. 시리즈 의도라면 일관성을 유지하고, 피로 요인인지는 직접 시청 데이터로 판단하세요.",
    tone: "neutral",
  },
  irregular_upload_interval: {
    title: "업로드 간격 불규칙",
    description:
      "irregular_upload_interval이 기록되었습니다. 검색 노출과 간접적으로 연관될 수 있으나, 인과관계는 단정하지 않습니다.",
    tone: "neutral",
  },
  low_upload_frequency: {
    title: "업로드 빈도 낮음",
    description:
      "low_upload_frequency가 기록되었습니다. 채널 신호 측면에서 점검 가치는 있으나, 순위 보장과 연결하지 않습니다.",
    tone: "neutral",
  },
  short_video_dominant: {
    title: "짧은 영상 비중",
    description:
      "short_video_dominant 플래그입니다. 숏폼/롱폼 전략과 제목·설명 길이의 일관성만 점검하세요.",
    tone: "neutral",
  },
  long_video_dominant: {
    title: "긴 영상 비중",
    description:
      "long_video_dominant 플래그입니다. 제목이 길이에 맞게 정보를 담는지, 설명란에 목차·타임스탬프를 쓸 여지가 있는지 검토하세요.",
    tone: "neutral",
  },
  high_view_variance: {
    title: "조회수 편차 큼",
    description:
      "high_view_variance가 기록되었습니다. 제목·썸네일 패턴 차이를 표본 내에서만 비교하고, 외부 순위로 해석하지 마세요.",
    tone: "neutral",
  },
};

function buildPatternInsights(flags: string[]): SeoLabPatternInsightVm[] {
  const out: SeoLabPatternInsightVm[] = [];
  let i = 0;
  for (const flag of flags) {
    const mapped = PATTERN_INSIGHTS[flag];
    if (!mapped) continue;
    out.push({
      id: `pat-${i}`,
      title: mapped.title,
      description: mapped.description,
      tone: mapped.tone,
    });
    i += 1;
  }
  return out;
}

function collectSeoRelatedNotes(
  weaknesses: string[],
  bottlenecks: string[]
): string[] {
  const raw = [...weaknesses, ...bottlenecks];
  const hit = raw.filter((t) => isSeoRelatedText(t));
  return uniqueTrimmed(hit).slice(0, 6);
}

/**
 * TODO(확장 수집): 외부 SERP·검색 볼륨·키워드 API는
 * `getMenuExtensionStrategy("seo_lab").futureCollectionFields` 에 정의된 범위로만 추가한다.
 */
function buildCheckCards(
  metrics: MetricsPartial | null,
  sections: ChannelSectionScores | null,
  flags: string[]
): SeoLabCheckCardVm[] {
  const cards: SeoLabCheckCardVm[] = [];

  if (metrics?.avgTitleLength != null && Number.isFinite(metrics.avgTitleLength)) {
    const n = Math.round(metrics.avgTitleLength);
    cards.push({
      id: "chk-title-len",
      itemName: "제목 길이(표본 평균)",
      currentState: `스냅샷 표본 기준 평균 제목 길이 약 ${n}자입니다.`,
      whyCheck:
        "제목이 너무 짧으면 주제 파악이 어렵고, 지나치게 길면 기기별 미리보기에서 잘릴 수 있습니다.",
      improveDirection:
        "핵심 주제·차별점을 앞쪽에 두고, 불필요한 수식어를 줄이는 방향을 검토하세요.",
      hint: "대체 제목 문구는 데이터가 없어 생성하지 않습니다.",
    });
  }

  if (metrics?.avgTagCount != null && Number.isFinite(metrics.avgTagCount)) {
    cards.push({
      id: "chk-tag-count",
      itemName: "태그 수(표본 평균)",
      currentState: `표본 평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개입니다.`,
      whyCheck:
        "태그는 주제 표시용이며, 외부 검색량·경쟁도는 이 페이지에서 다루지 않습니다.",
      improveDirection:
        "주제와 직접 연관된 태그 위주로 정리하고, 중복·무관 태그를 줄이는 편이 안전합니다.",
      hint: "검색 순위나 상위노출을 보장하지 않습니다.",
    });
  }

  if (flags.includes("low_tag_usage")) {
    cards.push({
      id: "chk-flag-low-tags",
      itemName: "패턴: 태그 사용 부족",
      currentState: "스냅샷에 low_tag_usage 플래그가 포함되어 있습니다.",
      whyCheck: "메타 정보가 부족하면 주제 전달이 약해질 수 있습니다.",
      improveDirection:
        "영상 주제를 한두 단어로 정리한 뒤, 그에 맞는 태그만 추가해 보세요.",
      hint: "플래그는 참고 신호이며 단정적 진단이 아닙니다.",
    });
  }

  if (sections != null) {
    if (sections.seoOptimization < 55) {
      cards.push({
        id: "chk-seo-score-low",
        itemName: "메타·발견성 구간 점수",
        currentState: `저장된 메타·발견성(seoOptimization) 구간 점수는 약 ${Math.round(sections.seoOptimization)}점입니다.`,
        whyCheck: "엔진이 낮게 기록한 구간이므로 메타·제목·태그 일관성을 점검할 가치가 있습니다.",
        improveDirection:
          "/analysis의 동일 구간 카드와 수치를 함께 보고, 한 가지 요소만 실험적으로 조정하세요.",
        hint: "점수는 내부 모델 기준이며 외부 검색 결과와 일치하지 않을 수 있습니다.",
      });
    }
    if (sections.contentStructure < 55) {
      cards.push({
        id: "chk-structure-score-low",
        itemName: "콘텐츠·구조 구간 점수",
        currentState: `콘텐츠·구조(contentStructure) 구간 점수는 약 ${Math.round(sections.contentStructure)}점입니다.`,
        whyCheck: "제목 형식·길이·포맷 일관성 등이 검색 친화적 메타와 연결될 수 있습니다.",
        improveDirection:
          "최근 표본 제목들의 패턴(길이, 접두어, 시리즈 표기)을 통일할지 검토하세요.",
        hint: "구조 개선이 조회나 순위를 보장하지는 않습니다.",
      });
    }
  }

  return cards;
}

export function buildSeoLabPageViewModel(
  data: AnalysisPageData | null
): SeoLabPageViewModel {
  const ext = buildSeoLabMarketExtensionSlice();
  const empty: SeoLabPageViewModel = {
    ...ext,
    ...deriveExtensionMenuFields(null, "seo_lab"),
    analysisRunsLoaded: deriveAnalysisRunsLoaded(null),
    ...pickYoutubeAccessFieldsFromPageData(null),
    limitNotice: null,
    hasChannel: false,
    hasAnalysis: false,
    selectedChannelId: null,
    channelTitle: null,
    seoSectionScore: null,
    structureSectionScore: null,
    seoStrategySummary: "",
    recommendedKeywordAngles: [],
    recommendedTitlePatterns: [],
    avoidKeywordAngles: [],
    evidenceNotes: [],
    hasEnoughSeoSignal: false,
    summaryLines: [],
    checkCards: [],
    titleSamples: [],
    patternInsights: [],
    seoRelatedNotes: [],
    sampleSizeNote: null,
    analysisConfidence: null,
    strategicComment: null,
  };

  if (!data || data.channels.length === 0 || !data.selectedChannel) {
    return {
      ...empty,
      ...deriveExtensionMenuFields(data, "seo_lab"),
      analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
      ...pickYoutubeAccessFieldsFromPageData(data ?? null),
      hasChannel: false,
      limitNotice:
        "연결된 채널이 없습니다. 설정에서 채널을 연결하면 SEO 점검 화면을 사용할 수 있습니다.",
    };
  }

  const ch = data.selectedChannel;
  const channelTitle = ch.channel_title ?? null;

  if (!data.latestResult) {
    return {
      ...empty,
      ...deriveExtensionMenuFields(data, "seo_lab"),
      analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
      ...pickYoutubeAccessFieldsFromPageData(data),
      hasChannel: true,
      hasAnalysis: false,
      selectedChannelId: ch.id,
      channelTitle,
      limitNotice:
        "저장된 분석 결과가 없습니다. /analysis에서 분석을 완료한 뒤 다시 열어 주세요.",
    };
  }

  const row = enrichRowScores(data.latestResult);
  const snapshot = row.feature_snapshot;
  const metrics = extractMetricsFromSnapshot(snapshot);
  const flags = extractPatternFlags(snapshot);
  const sections = parseSectionScores(row.feature_section_scores);

  const seoSectionScore =
    sections != null ? Math.round(sections.seoOptimization) : null;
  const structureSectionScore =
    sections != null ? Math.round(sections.contentStructure) : null;

  const weaknesses = safeStringArray(row.weaknesses);
  const bottlenecks = safeStringArray(row.bottlenecks);
  const seoRelatedNotes = collectSeoRelatedNotes(weaknesses, bottlenecks);

  const videos = parseVideosFromSnapshot(snapshot);
  const avgTitleLen =
    metrics?.avgTitleLength != null && Number.isFinite(metrics.avgTitleLength)
      ? metrics.avgTitleLength
      : null;

  const titleSamples: SeoLabTitleSampleVm[] = videos.slice(0, 6).map((v) => ({
    title: v.title,
    publishedAt: v.publishedAt,
    directionHint: hintForTitle(v.title, avgTitleLen),
  }));

  const checkCards = buildCheckCards(metrics, sections, flags);
  let patternInsights = buildPatternInsights(flags);
  const knownPatternKeys = new Set(Object.keys(PATTERN_INSIGHTS));
  const unknownFlags = flags.filter((f) => !knownPatternKeys.has(f));
  if (unknownFlags.length > 0) {
    const listed = unknownFlags.slice(0, 8).join(", ");
    const suffix = unknownFlags.length > 8 ? " …" : "";
    patternInsights = [
      ...patternInsights,
      {
        id: "pat-unknown",
        title: "기록된 기타 패턴 플래그",
        description: `스냅샷 patterns에 다음 값이 있습니다: ${listed}${suffix}. 자동 해석 템플릿이 없어 /analysis 표본과 함께 확인하세요.`,
        tone: "neutral" as const,
      },
    ];
  }

  const benchVm = buildInternalChannelDnaSummary(data);
  const signalPayload = buildSeoStrategySignals(benchVm, {
    patternFlags: flags,
    avgTitleLength: avgTitleLen,
    avgTagCount:
      metrics?.avgTagCount != null && Number.isFinite(metrics.avgTagCount)
        ? metrics.avgTagCount
        : null,
    seoOptimizationScore: sections?.seoOptimization ?? null,
    contentStructureScore: sections?.contentStructure ?? null,
  });
  const strategySection = buildSeoRecommendations(benchVm, signalPayload);

  const summaryLines: SeoLabSummaryLineVm[] = [];

  summaryLines.push({
    label: "제목·메타(발견성) 구간",
    body:
      seoSectionScore != null
        ? `저장된 점수 ${seoSectionScore}점(내부 모델). 검색 순위와 동일하지 않을 수 있습니다.`
        : "구간 점수가 스냅샷에 없습니다.",
  });

  summaryLines.push({
    label: "콘텐츠·구조 구간",
    body:
      structureSectionScore != null
        ? `저장된 점수 ${structureSectionScore}점. 제목·포맷 일관성 참고용입니다.`
        : "구간 점수가 스냅샷에 없습니다.",
  });

  summaryLines.push({
    label: "태그·메타 일관성",
    body:
      metrics?.avgTagCount != null
        ? `표본 평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개. 범용 키워드 탐색이 아니라 이 채널 표본과 제목 앞단어의 정합만 참고하세요.`
        : "태그 수 등 메트릭이 없어 수치 요약을 생략합니다.",
  });

  summaryLines.push({
    label: "데이터 범위",
    body:
      titleSamples.length > 0
        ? `표본 제목 ${titleSamples.length}개까지 표시합니다. 전체 영상과 다를 수 있습니다.`
        : "스냅샷에 제목 표본이 없어 제목별 점검은 방향 안내만 제공합니다.",
  });

  const sampleNote =
    typeof row.sample_size_note === "string"
      ? row.sample_size_note
      : null;
  const confidenceRaw = row.analysis_confidence;
  const analysisConfidence =
    confidenceRaw === "low" ||
    confidenceRaw === "medium" ||
    confidenceRaw === "high"
      ? confidenceRaw
      : null;

  const noticeParts: string[] = [
    "SEO Lab은 범용 키워드 도구가 아니라, 저장된 분석·채널 DNA에서 읽힌 이 채널 구조에 맞는 제목·메타 방향만 제한적으로 제안합니다. 검색 순위·상위노출을 보장하지 않으며, 외부 검색량·경쟁 지표는 연동되어 있지 않습니다.",
  ];
  if (!metrics) {
    noticeParts.push("스냅샷 메트릭이 없어 세부 수치 기반 카드가 줄어듭니다.");
  }
  if (analysisConfidence === "low") {
    noticeParts.push("분석 신뢰도가 낮게 기록되었습니다.");
  }
  if (
    checkCards.length === 0 &&
    titleSamples.length === 0 &&
    patternInsights.length === 0 &&
    seoRelatedNotes.length === 0
  ) {
    noticeParts.push("SEO 관련 표본·패턴·문구가 거의 없어 화면이 최소 구성입니다.");
  }
  const limitNotice = noticeParts.join(" ");

  const strategicComment = buildSeoLabStrategicComment({
    seoSectionScore,
    structureSectionScore,
    seoStrategySummary: strategySection.seoStrategySummary ?? "",
    recommendedKeywordAngles: strategySection.recommendedKeywordAngles ?? [],
    recommendedTitlePatterns: strategySection.recommendedTitlePatterns ?? [],
    checkCards,
    analysisConfidence,
  });

  return {
    ...ext,
    ...deriveExtensionMenuFields(data, "seo_lab"),
    analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
    ...pickYoutubeAccessFieldsFromPageData(data),
    limitNotice,
    hasChannel: true,
    hasAnalysis: true,
    selectedChannelId: ch.id,
    channelTitle,
    seoSectionScore,
    structureSectionScore,
    ...strategySection,
    summaryLines,
    checkCards,
    titleSamples,
    patternInsights,
    seoRelatedNotes,
    sampleSizeNote: sampleNote,
    analysisConfidence,
    strategicComment,
  };
}

function buildSeoLabStrategicComment(params: {
  seoSectionScore: number | null;
  structureSectionScore: number | null;
  seoStrategySummary: string;
  recommendedKeywordAngles: SeoStrategyItemVm[];
  recommendedTitlePatterns: SeoStrategyItemVm[];
  checkCards: SeoLabCheckCardVm[];
  analysisConfidence: "low" | "medium" | "high" | null;
}): StrategicCommentVm | null {
  const {
    seoSectionScore,
    structureSectionScore,
    seoStrategySummary,
    recommendedKeywordAngles,
    recommendedTitlePatterns,
    checkCards,
    analysisConfidence,
  } = params;

  const hasAnyData =
    seoSectionScore != null ||
    structureSectionScore != null ||
    seoStrategySummary.length > 0 ||
    recommendedKeywordAngles.length > 0;
  if (!hasAnyData) return null;

  const scoreText =
    seoSectionScore != null
      ? `SEO 구간 ${seoSectionScore}점`
      : structureSectionScore != null
        ? `콘텐츠 구조 ${structureSectionScore}점`
        : null;

  const qualLabel =
    seoSectionScore != null
      ? seoSectionScore >= 65
        ? "기본 SEO 구조 확인됨"
        : "SEO 메타 정교화가 필요한 수준"
      : "채널 맞춤 SEO 방향 분석";

  const headline = scoreText ? `${scoreText} — ${qualLabel}` : qualLabel;

  const summaryParts: string[] = [];
  if (seoStrategySummary.length > 0) {
    summaryParts.push(
      seoStrategySummary.length > 130
        ? seoStrategySummary.slice(0, 130) + "…"
        : seoStrategySummary
    );
  } else {
    summaryParts.push(
      "저장된 채널 스냅샷 기반으로 SEO 방향을 분석했습니다. 검색 순위와 직접 연결되지 않으며, 채널 구조 개선 참고용입니다."
    );
  }

  const takeaways: string[] = [];
  if (recommendedKeywordAngles.length > 0)
    takeaways.push(`키워드 방향: ${recommendedKeywordAngles[0].title}`);
  if (recommendedTitlePatterns.length > 0)
    takeaways.push(`제목 패턴: ${recommendedTitlePatterns[0].title}`);
  if (checkCards.length > 0) takeaways.push(`점검 항목: ${checkCards[0].itemName}`);

  const caution =
    analysisConfidence === "low"
      ? "분석 신뢰도가 낮게 기록되어 SEO 방향의 정확도가 제한될 수 있습니다."
      : null;

  return {
    headline,
    summary: summaryParts[0],
    keyTakeaways: takeaways.slice(0, 3),
    priorityAction:
      recommendedTitlePatterns[0]?.title ??
      recommendedKeywordAngles[0]?.title ??
      null,
    caution,
  };
}
