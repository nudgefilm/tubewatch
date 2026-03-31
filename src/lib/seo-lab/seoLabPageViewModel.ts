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
import { normalizeFeatureSnapshot } from "@/lib/analysis/normalizeSnapshot";

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
  /** 제목의 문제 요약 1줄 */
  problem: string;
  /** 교체 가능한 수정 방향 1줄 */
  suggestion: string;
};

export type SeoLabActionBlockItemVm = {
  label: string;
  target: string;
  scope: string;
};

export type SeoLabImprovedRangeVm = {
  current: number;
  min: number;
  max: number;
  reasons: string[];
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
  /** 페이지 최상단 즉시 실행 블록 */
  actionBlockItems: SeoLabActionBlockItemVm[];
  /** SEO 점수 현재 → 개선 후 범위 시뮬레이션 */
  seoImprovedRange: SeoLabImprovedRangeVm | null;
  /** 복붙 가능한 제목 패턴 템플릿 2~3개 */
  titleTemplates: { pattern: string; example: string }[];
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

function hintForTitle(
  title: string,
  avgTitleLen: number | null
): { problem: string; suggestion: string } {
  const len = title.length;
  if (avgTitleLen != null && Number.isFinite(avgTitleLen) && avgTitleLen > 0) {
    if (len < avgTitleLen * 0.65) {
      return {
        problem: `제목이 ${len}자로 짧아 핵심 주제와 차별점이 보이지 않습니다.`,
        suggestion: `[핵심 키워드] + [구체적 숫자/결과] 형태로 확장하세요`,
      };
    }
    if (len > avgTitleLen * 1.35) {
      return {
        problem: `제목이 ${len}자로 길어 앞부분 핵심 키워드가 묻힙니다.`,
        suggestion: `수식어를 뒤로 이동하고 앞 15자에 핵심 주제를 드러내세요`,
      };
    }
  }
  return {
    problem: "핵심 키워드가 제목 앞 15자 안에 배치됐는지 확인 필요합니다.",
    suggestion: "[핵심 키워드] + [결과/혜택] 구조인지 지금 검토하세요",
  };
}

function buildActionBlockItems(
  checkCards: SeoLabCheckCardVm[],
  seoScore: number | null,
  metrics: MetricsPartial | null
): SeoLabActionBlockItemVm[] {
  const items: SeoLabActionBlockItemVm[] = [];
  for (const card of checkCards.slice(0, 3)) {
    items.push({
      label: card.itemName,
      target: card.improveDirection,
      scope: "다음 2~3개 영상에서 수정 테스트",
    });
  }
  if (items.length === 0 && seoScore != null && seoScore < 55) {
    items.push({
      label: "SEO 최적화 구간 낮음",
      target: "제목 앞 15자에 핵심 키워드 배치",
      scope: "다음 2개 영상에서 수정 테스트",
    });
    if (metrics?.avgTagCount != null && metrics.avgTagCount < 5) {
      items.push({
        label: `태그 수 부족 (평균 ${metrics.avgTagCount.toFixed(1)}개)`,
        target: "주제 적합 태그 5~10개 추가",
        scope: "다음 2개 영상에서 수정 테스트",
      });
    }
  }
  return items.slice(0, 3);
}

function buildSeoImprovedRange(
  seoScore: number | null,
  checkCards: SeoLabCheckCardVm[]
): SeoLabImprovedRangeVm | null {
  if (seoScore == null) return null;
  const gains: number[] = [];
  const reasons: string[] = [];
  if (checkCards.some((c) => c.id === "chk-title-len")) {
    gains.push(8);
    reasons.push("키워드 위치 개선");
  }
  if (checkCards.some((c) => c.id === "chk-tag-count" || c.id === "chk-flag-low-tags")) {
    gains.push(10);
    reasons.push("태그 정렬 효과");
  }
  if (checkCards.some((c) => c.id === "chk-seo-score-low")) {
    gains.push(8);
    reasons.push("SEO 구간 종합 개선");
  }
  if (checkCards.some((c) => c.id === "chk-structure-score-low")) {
    gains.push(6);
    reasons.push("포맷 일관성 확보");
  }
  const totalGain = gains.reduce((a, b) => a + b, 0);
  if (totalGain === 0) return null;
  return {
    current: seoScore,
    min: Math.min(seoScore + Math.floor(totalGain * 0.7), 95),
    max: Math.min(seoScore + totalGain, 100),
    reasons: reasons.slice(0, 3),
  };
}

function buildTitleTemplates(
  dominantFormat: string | null
): { pattern: string; example: string }[] {
  const isShort =
    dominantFormat != null &&
    /쇼츠|shorts|short/i.test(dominantFormat);
  if (isShort) {
    return [
      { pattern: "[핵심 키워드] + [숫자/결과]", example: "쇼츠 수익화 3가지" },
      { pattern: "[질문형] + [핵심 주제]", example: "왜 쇼츠가 안 뜰까?" },
    ];
  }
  return [
    { pattern: "[키워드] + [결과/혜택]", example: "유튜브 SEO 완전 정복" },
    { pattern: "[숫자] + [문제 해결]", example: "조회수 터지는 썸네일 5가지 법칙" },
    { pattern: "[질문형] + [해결 키워드]", example: "왜 내 영상은 알고리즘에 안 뜰까?" },
  ];
}

const PATTERN_INSIGHTS: Record<
  string,
  { title: string; description: string; tone: "neutral" | "caution" }
> = {
  low_tag_usage: {
    title: "태그 부족 — 지금 바로 주제 태그를 추가하세요",
    description:
      "태그 수가 낮게 탐지되었습니다. 영상 주제와 직접 연관된 태그 5~10개를 지금 추가하고, 제목 앞부분 키워드와 일치시키세요.",
    tone: "caution",
  },
  repeated_topic_pattern: {
    title: "반복 주제 — 시리즈 접두어를 통일하세요",
    description:
      "주제·포맷 반복 패턴이 감지되었습니다. 의도적 시리즈라면 회차·파트 표기를 제목 정책으로 고정하세요. 시청자가 연속성을 바로 인식할 수 있도록 접두어를 통일합니다.",
    tone: "neutral",
  },
  irregular_upload_interval: {
    title: "업로드 간격 불규칙 — 발행 달력을 만드세요",
    description:
      "업로드 간격이 불규칙하게 기록되었습니다. 다음 달 업로드 예정일을 달력에 고정하고, 제목·시리즈 표기와 리듬을 맞추세요.",
    tone: "neutral",
  },
  low_upload_frequency: {
    title: "업로드 빈도 낮음 — 주기 확보가 우선입니다",
    description:
      "업로드 빈도가 낮게 기록되었습니다. 월 최소 업로드 횟수를 정하고 달력에 먼저 배치한 뒤, 제목 구조를 정비하세요.",
    tone: "neutral",
  },
  short_video_dominant: {
    title: "숏폼 중심 — 제목과 설명 길이를 숏폼에 맞추세요",
    description:
      "짧은 영상 비중이 높게 탐지되었습니다. 숏폼 제목은 첫 한 줄에 핵심 내용을 압축하고, 설명란도 2~3줄 이내로 최적화하세요.",
    tone: "neutral",
  },
  long_video_dominant: {
    title: "롱폼 중심 — 설명란에 목차와 타임스탬프를 추가하세요",
    description:
      "긴 영상 비중이 높게 탐지되었습니다. 설명란에 목차와 타임스탬프를 추가하면 검색 노출과 시청 유지에 유리합니다. 지금 최근 영상 3개부터 적용하세요.",
    tone: "neutral",
  },
  high_view_variance: {
    title: "조회수 편차 큼 — 상위 영상 제목 구조를 분석하세요",
    description:
      "조회수 편차가 크게 기록되었습니다. 상위 영상의 제목·썸네일 구조를 하위 영상과 표로 비교하고, 반복 가능한 패턴을 찾으세요.",
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
    const isShort = n < 20;
    const isLong = n > 40;
    cards.push({
      id: "chk-title-len",
      itemName: isShort
        ? "제목 길이 — 핵심 주제가 보이지 않습니다"
        : isLong
          ? "제목 길이 — 앞부분을 더 짧게 다듬으세요"
          : "제목 길이 — 키워드 배치를 점검하세요",
      currentState: `표본 평균 제목 길이 약 ${n}자입니다.`,
      whyCheck: isLong
        ? "제목이 길면 모바일 미리보기에서 핵심 주제가 잘립니다. 클릭을 결정하는 건 앞 15자입니다."
        : "제목이 너무 짧으면 주제와 차별점이 전달되지 않습니다.",
      improveDirection:
        "핵심 키워드를 앞 15자 안에 배치하고, 불필요한 수식어는 뒤로 이동하거나 제거하세요.",
      hint: isShort || isLong
        ? "지금 영상 3개를 골라 제목을 다시 써 보세요."
        : "현재 길이는 적정 수준입니다. 키워드 배치만 점검하세요.",
    });
  }

  if (metrics?.avgTagCount != null && Number.isFinite(metrics.avgTagCount)) {
    const n = metrics.avgTagCount;
    const isFew = n < 5;
    cards.push({
      id: "chk-tag-count",
      itemName: isFew
        ? "태그 수 — 지금 태그를 더 추가하세요"
        : "태그 수 — 무관 태그를 정리하세요",
      currentState: `표본 평균 태그 수 약 ${n.toFixed(1)}개입니다.`,
      whyCheck: isFew
        ? "태그가 적으면 알고리즘이 주제를 파악하기 어렵습니다. 주제 태그를 빠짐없이 사용하세요."
        : "태그가 많아도 무관 태그는 주제 신호를 희석합니다. 주제와 직접 연관된 태그만 남기세요.",
      improveDirection: isFew
        ? "영상 주제와 직접 연관된 태그 5~10개를 지금 추가하세요."
        : "주제와 직접 연관된 태그만 남기고, 중복·무관 태그를 제거하세요.",
      hint: "제목 앞부분 키워드와 태그를 일치시키면 알고리즘 주제 인식이 강화됩니다.",
    });
  }

  if (flags.includes("low_tag_usage")) {
    cards.push({
      id: "chk-flag-low-tags",
      itemName: "태그 부족 패턴 — 지금 태그를 추가하세요",
      currentState: "태그 사용이 부족한 패턴이 탐지되었습니다.",
      whyCheck: "태그 부족은 알고리즘이 영상 주제를 파악하는 데 불리하게 작용합니다.",
      improveDirection:
        "영상 주제를 한두 단어로 정리한 뒤, 주제에 맞는 태그 5~8개를 지금 바로 추가하세요.",
      hint: "제목 앞부분 키워드와 태그를 일치시키는 것이 가장 효과적입니다.",
    });
  }

  if (sections != null) {
    if (sections.seoOptimization < 55) {
      cards.push({
        id: "chk-seo-score-low",
        itemName: "SEO 최적화 구간 — 노출이 제한되는 상태입니다",
        currentState: `메타·발견성 구간이 ${Math.round(sections.seoOptimization)}점으로 기준(55점) 이하입니다.`,
        whyCheck:
          "지금은 메타 구조가 약해 알고리즘이 채널 주제를 명확히 인식하지 못하고 있습니다.",
        improveDirection:
          "/analysis 동일 구간과 함께 보며 제목·태그·설명 중 한 가지 요소만 바꿔 2~3회 업로드에서 변화를 측정하세요.",
        hint: "점수를 올리려면 제목 앞부분 키워드 → 태그 일치 → 설명란 첫 줄 순서로 개선하세요.",
      });
    }
    if (sections.contentStructure < 55) {
      cards.push({
        id: "chk-structure-score-low",
        itemName: "콘텐츠 구조 구간 — 포맷 일관성을 높이세요",
        currentState: `콘텐츠·구조 구간이 ${Math.round(sections.contentStructure)}점으로 기준(55점) 이하입니다.`,
        whyCheck:
          "제목 형식·길이·포맷이 불규칙하면 알고리즘과 시청자 모두 채널 정체성을 파악하기 어렵습니다.",
        improveDirection:
          "최근 표본 제목들의 길이, 접두어, 시리즈 표기를 통일하고 다음 3편에 바로 적용하세요.",
        hint: "포맷 통일은 SEO 점수와 채널 브랜딩을 동시에 개선하는 가장 빠른 방법입니다.",
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
    actionBlockItems: [],
    seoImprovedRange: null,
    titleTemplates: [],
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
  const normalized = normalizeFeatureSnapshot(row.feature_snapshot);
  const metrics = normalized.metrics as MetricsPartial | null;
  const flags = normalized.patterns;
  const sections = parseSectionScores(row.feature_section_scores);

  const seoSectionScore =
    sections != null ? Math.round(sections.seoOptimization) : null;
  const structureSectionScore =
    sections != null ? Math.round(sections.contentStructure) : null;

  const weaknesses = safeStringArray(row.weaknesses);
  const bottlenecks = safeStringArray(row.bottlenecks);
  const seoRelatedNotes = collectSeoRelatedNotes(weaknesses, bottlenecks);

  const videos = normalized.videos;
  const avgTitleLen =
    metrics?.avgTitleLength != null && Number.isFinite(metrics.avgTitleLength)
      ? metrics.avgTitleLength
      : null;

  const titleSamples: SeoLabTitleSampleVm[] = videos.slice(0, 6).map((v) => {
    const { problem, suggestion } = hintForTitle(v.title, avgTitleLen);
    return { title: v.title, publishedAt: v.publishedAt, problem, suggestion };
  });

  const checkCards = buildCheckCards(metrics, sections, flags);
  const actionBlockItems = buildActionBlockItems(checkCards, seoSectionScore, metrics);
  const seoImprovedRange = buildSeoImprovedRange(seoSectionScore, checkCards);
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
  const titleTemplates = buildTitleTemplates(benchVm.dominantFormat ?? null);
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
    label: "제목 전략",
    body:
      seoSectionScore != null
        ? seoSectionScore >= 65
          ? `SEO 구조(${seoSectionScore}점)가 기본 수준입니다. 제목 첫 15자에 핵심 주제를 명시하고, 중복 수식어를 제거하면 클릭률을 더 높일 수 있습니다.`
          : `지금은 메타 구조(${seoSectionScore}점)가 약해 노출이 제한됩니다. 제목 앞부분에 핵심 키워드를 배치하고 불필요한 감탄사를 제거하세요.`
        : "제목 앞 15자에 핵심 주제가 드러나도록 수정하세요.",
  });

  summaryLines.push({
    label: "태그 전략",
    body:
      metrics?.avgTagCount != null
        ? `현재 표본 평균 태그 수 ${metrics.avgTagCount.toFixed(1)}개입니다. 주제와 직접 연관된 5~10개 태그로 압축하고, 제목 앞부분 키워드와 일치시키세요.`
        : "주제 태그와 제목 앞단어를 일치시키세요. 무관 태그는 제거합니다.",
  });

  if (structureSectionScore != null) {
    summaryLines.push({
      label: "포맷 전략",
      body:
        structureSectionScore >= 65
          ? `콘텐츠 구조(${structureSectionScore}점)가 안정적입니다. 이 포맷을 유지하면서 제목 앞부분만 추가 최적화하세요.`
          : `콘텐츠 구조(${structureSectionScore}점)가 불규칙합니다. 제목 길이와 포맷을 표본끼리 통일하고 다음 3편에 바로 적용하세요.`,
    });
  }

  summaryLines.push({
    label: "노출 확장 방향",
    body:
      titleSamples.length > 0
        ? `표본 ${titleSamples.length}개 제목을 기반으로 방향을 분석했습니다. 위 바로 적용 예시를 참고해 다음 영상 제목을 수정하세요.`
        : "제목 샘플이 없어 일반 방향 안내를 제공합니다. 분석을 실행하면 맞춤 샘플이 생성됩니다.",
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
    "이 채널 데이터 기반 알고리즘 침투 전략입니다. 외부 검색량은 연동되어 있지 않으며, 채널 구조 개선을 통한 발견성 향상에 집중합니다.",
  ];
  if (!metrics) {
    noticeParts.push("스냅샷 메트릭이 없어 수치 기반 카드 일부가 생략됩니다.");
  }
  if (analysisConfidence === "low") {
    noticeParts.push("분석 표본이 적어 방향의 정확도가 제한됩니다. 더 많은 영상을 분석하면 정확도가 높아집니다.");
  }
  if (
    checkCards.length === 0 &&
    titleSamples.length === 0 &&
    patternInsights.length === 0 &&
    seoRelatedNotes.length === 0
  ) {
    noticeParts.push("SEO 관련 표본·패턴이 충분하지 않아 화면이 최소 구성입니다.");
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
    actionBlockItems,
    seoImprovedRange,
    titleTemplates,
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
        ? "기본 SEO 구조 확인 — 추가 최적화로 노출 확장 가능"
        : "SEO 메타 개선 필요 — 제목·태그 정비가 우선입니다"
      : "채널 맞춤 알고리즘 침투 전략";

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
      "채널 구조 분석 기반으로 알고리즘 침투 전략을 생성했습니다. 제목·태그·포맷 개선 순서로 실행하세요."
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
