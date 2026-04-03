/**
 * Action Plan 화면은 `analysis_results` 베이스 스냅샷만으로 카드·체크리스트를 구성한다.
 * 확장 범위·향후 수집 필드: `@/lib/analysis/menuExtensionDataStrategy` 의 `action_plan`.
 */
import type {
  AnalysisPageData,
  AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import { normalizeFeatureSnapshot, type NormalizedSnapshotVideo } from "@/lib/analysis/normalizeSnapshot";
import { enrichRowScores } from "@/lib/server/analysis/mapAnalysisHistoryAndCompare";
import type { MarketExtensionSliceVm } from "@/lib/data/marketExtensionSlice";
import { buildDefaultMarketExtensionSlice } from "@/lib/data/marketExtensionSlice";
import {
  deriveAnalysisRunsLoaded,
  deriveExtensionMenuFields,
} from "@/lib/analysis/analysisRun";
import { pickYoutubeAccessFieldsFromPageData } from "@/lib/analysis/pickYoutubeAccessFromPageData";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";
import type { AnalysisStatus } from "@/lib/analysis/types";
import type { StrategicCommentVm } from "@/lib/shared/strategicCommentTypes";
import { parseSectionScores } from "@/lib/analysis/engine/parseSectionScores";
import { buildInternalChannelDnaSummary } from "@/lib/channel-dna/internalChannelDnaSummary";
import { pickChannelDnaSignalsForActionPlan } from "@/lib/channel-dna/channelDnaSignalsForActionPlan";
import { makeDiagnosticLabel } from "@/lib/utils/labelUtils";
import {
  buildChannelDnaActionCandidates,
  filterMetricActionsSupersededByChannelDna,
  type ChannelDnaActionCandidate,
} from "@/lib/action-plan/buildChannelDnaActionCandidates";

export type ActionPlanPriority = "P1" | "P2" | "P3";

export type ActionPlanCardVm = {
  id: string;
  priority: ActionPlanPriority;
  title: string;
  whyNeeded: string;
  expectedEffect: string;
  /**
   * 3단 변화 시나리오. "\n" 구분자로 3파트:
   * [0] 실행 전 상태  [1] 변화 메커니즘  [2] 기대 시나리오
   */
  scenarioText?: string;
  difficulty: "low" | "medium" | "high";
  executionHint: string;
  /** `/channel-dna`와 동일 스냅샷에서 계산된 룰 기반 근거 */
  evidenceSource?: "channel_dna";
  /** 성과 예측 블록 — 현재 수치 → 목표 범위 → 기대 변화 */
  performancePrediction?: {
    current: string;
    targetRange: string;
    expectedChanges: string[];
    /** 예측의 실제 계산 근거 1줄 — 없으면 숨김 */
    predictionBasis?: string;
  };
  /** 실행 조건 — 적용 영상 수 · 변경 요소 1개 · 비교 기준 */
  executionSpec?: {
    videoCount: string;
    targetElement: string;
    comparisonBasis: string;
  };
};

export type ActionPlanChecklistVm = {
  id: string;
  title: string;
  description: string;
  /** v0 ChecklistItem: easy | medium | hard */
  difficulty: "easy" | "medium" | "hard";
};

export type ActionPlanSectionLineVm = {
  label: string;
  score: number;
};

/** 황금·누락 키워드 + 설명란 진단 ViewModel */
export type SeoKeywordVm = {
  /** 상위 성과 영상에서 자주 쓰인 태그 */
  goldenKeywords: { tag: string; usageCount: number; avgViews: number }[];
  /** 상위 영상엔 있지만 하위 영상엔 없는 태그 */
  missingKeywords: { tag: string; topOnlyCount: number }[];
  descriptionStats: {
    avgLength: number;
    shortCount: number;
    goodCount: number;
    totalCount: number;
    status: "too_short" | "moderate" | "good";
    guideText: string;
  } | null;
  /** 태그 데이터 자체가 없는 경우 false */
  hasTagData: boolean;
  sampleSize: number;
};

export type ActionPlanPageViewModel = {
  limitNotice: string | null;
  hasChannel: boolean;
  hasAnalysis: boolean;
  selectedChannelId: string | null;
  channelTitle: string | null;
  totalScore: number | null;
  sectionLines: ActionPlanSectionLineVm[];
  actions: ActionPlanCardVm[];
  checklistItems: ActionPlanChecklistVm[];
  cautions: string[];
  sampleSizeNote: string | null;
  analysisConfidence: "low" | "medium" | "high" | null;
  menuStatus: AnalysisStatus;
  lastRunAt: string | null;
  analysisRunsLoaded: boolean;
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
  /** 페이지 하단 전략 코멘트 카드 */
  strategicComment: StrategicCommentVm | null;
  /** SEO 키워드·설명란 진단 — 태그 데이터 없으면 null */
  seoKeywords: SeoKeywordVm | null;
  /** SEO 결손 리포트 — 설명란 짧음 + 태그 부족 영상 집계 */
  seoDeficit: SeoDeficitVm | null;
  /** 인게이지먼트 갭 — 좋아요 비율 분위 진단 */
  engagementGap: EngagementGapVm | null;
  /** 제목 언어 분석 — CTR 유발 키워드 추출 */
  linguisticInsight: LinguisticInsightVm | null;
} & MarketExtensionSliceVm;

/** 설명란·태그 기반 SEO 결손 현황 */
export type SeoDeficitVm = {
  totalCount: number;
  /** descriptionLength < 100자인 영상 수 */
  shortDescCount: number;
  shortDescPercent: number;
  /** tags.length < 3인 영상 수 */
  lowTagCount: number;
  lowTagPercent: number;
};

/** 좋아요 비율 분위 진단 */
export type EngagementGapVm = {
  /** 표본 평균 좋아요 비율 (0–1) */
  avgLikeRate: number;
  /** 표본 내 백분위 (낮을수록 하위) */
  percentileLabel: string;  // "하위 20%", "평균 수준" 등
  hasLowEngagement: boolean;
  sampleCount: number;
};

/** 제목 언어 분석 — 조회수 상위 영상에서 공통 발견되는 CTR 유발 키워드 */
export type LinguisticInsightVm = {
  /** 상위 영상 제목에서 전체 대비 빈도 lift가 높은 키워드 (최대 6개) */
  ctrBoosters: { keyword: string; liftPercent: number }[];
  /** 상위 10% 표본 수 */
  topSampleCount: number;
  /** 전체 유효 표본 수 */
  totalSampleCount: number;
};

export type ChannelSectionScores = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
  subscriptionConversion?: number;
};

type MetricsPartial = Partial<Record<keyof ChannelMetrics, number>>;

const SECTION_LABELS: Record<string, string> = {
  channelActivity: "채널 활동 패턴",
  audienceResponse: "시청자 반응 구조",
  contentStructure: "콘텐츠·구조",
  seoOptimization: "SEO 최적화 상태",
  growthMomentum: "성장 모멘텀",
  subscriptionConversion: "구독 전환 구조",
};

const CONSERVATIVE_EFFECT =
  "소규모 실험으로 시청 지속시간과 CTR 변화를 직접 확인하면 재현 가능한 패턴을 좁혀나갈 수 있습니다.";

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );
}

function uniqueTrimmedStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = raw.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function titleFromText(text: string): string {
  return makeDiagnosticLabel(text);
}

type TextSourceKind = "weakness" | "bottleneck";
type TextCategory = "upload" | "response" | "keyword" | "content" | "growth" | "generic";

function classifyTextItem(text: string): TextCategory {
  const t = text.toLowerCase();
  if (/업로드|주기|간격|게시|발행|빈도/.test(t)) return "upload";
  if (/반응|좋아요|댓글|ctr|클릭|시청|조회수/.test(t)) return "response";
  if (/태그|키워드|seo|검색|메타|발견/.test(t)) return "keyword";
  if (/길이|포맷|구조|내용|완주|편집|이탈/.test(t)) return "content";
  if (/성장|구독|히트|트렌드|분포|편차/.test(t)) return "growth";
  return "generic";
}

function buildTextWhyNeeded(kind: TextSourceKind, category: TextCategory, rawText: string): string {
  switch (category) {
    case "upload":
      return kind === "bottleneck"
        ? `업로드 주기 또는 빈도에서 병목이 감지되었습니다. ${rawText} — 공백이 누적되면 알고리즘이 채널을 비활성으로 분류합니다.`
        : `업로드 패턴에서 약점 신호가 감지되었습니다. ${rawText} — 불규칙한 발행이 지속되면 구독자 기대 주기가 형성되지 않습니다.`;
    case "response":
      return kind === "bottleneck"
        ? `시청자 반응 구조 구간에서 병목이 감지되었습니다. ${rawText} — 반응 신호가 낮으면 알고리즘 추천 범위가 좁아집니다.`
        : `시청자 반응 구조 구간에서 약점 신호가 감지되었습니다. ${rawText} — 반응률이 낮은 상태가 이어지면 신규 노출이 줄어듭니다.`;
    case "keyword":
      return kind === "bottleneck"
        ? `SEO 최적화 상태 구간에서 병목이 감지되었습니다. ${rawText} — 검색 발견성이 낮으면 외부 유입 경로가 막힙니다.`
        : `SEO 최적화 상태 구간에서 약점 신호가 감지되었습니다. ${rawText} — 키워드 미최적화가 지속되면 신규 시청자 유입이 제한됩니다.`;
    case "content":
      return kind === "bottleneck"
        ? `콘텐츠·구조 구간에서 병목이 감지되었습니다. ${rawText} — 이탈 구간이 고착되면 시청 유지율 회복이 어렵습니다.`
        : `콘텐츠·구조 구간에서 약점 신호가 감지되었습니다. ${rawText} — 포맷 비일관성이 누적되면 채널 정체성이 흐려집니다.`;
    case "growth":
      return kind === "bottleneck"
        ? `성장 모멘텀 구간에서 병목이 감지되었습니다. ${rawText} — 성장 정체가 길어지면 알고리즘이 채널을 축소 노출합니다.`
        : `성장 모멘텀 구간에서 약점 신호가 감지되었습니다. ${rawText} — 히트 의존 구조가 유지되면 안정적 성장이 어렵습니다.`;
    default:
      return kind === "bottleneck"
        ? `분석 병목으로 진단된 구간입니다. ${rawText} — 이 구간이 해소되지 않으면 다른 지표 개선에도 제동이 걸립니다.`
        : `분석 약점으로 진단된 구간입니다. ${rawText} — 이 패턴이 누적되면 전체 채널 점수가 하락 압력을 받습니다.`;
  }
}

function buildTextExecutionHint(category: TextCategory): string {
  switch (category) {
    case "upload":
      return "다음 달 업로드 날짜를 달력에 먼저 배치하세요.\n공백이 2주 이상 벌어지지 않도록 간격을 조정하세요.";
    case "response":
      return "최근 영상 3개의 반응 수치를 나란히 비교하세요.\n제목·썸네일·첫 30초 중 차이가 큰 요소 하나만 바꿔 다음 업로드에서 측정하세요.";
    case "keyword":
      return "최근 영상 1개의 태그에서 주제 무관 태그를 제거하세요.\n제목 앞 15자에 핵심 키워드가 배치됐는지 확인하고 다음 업로드에 적용하세요.";
    case "content":
      return "최근 영상 2개에서 늘어지는 구간의 시간대를 기록하세요.\n30초 이상 구간이 있으면 다음 편집에서 줄이고 시청 유지율 변화를 확인하세요.";
    case "growth":
      return "중간 성과 영상 중 반복 가능한 포맷 1개를 선택하세요.\n다음 1편에서 그 포맷 그대로 업로드하고 이전 중앙값과 비교하세요.";
    default:
      return "이 신호의 원인을 하나로 좁혀 다음 1~2회 업로드에서 그 요소만 바꾸세요.\n변화가 없으면 다음 원인 가설로 이동하세요.";
  }
}

function buildTextExecutionSpec(
  category: TextCategory
): { videoCount: string; targetElement: string; comparisonBasis: string } {
  switch (category) {
    case "upload":
      return { videoCount: "다음 3회 업로드", targetElement: "업로드 간격", comparisonBasis: "현재 평균 간격 기준" };
    case "response":
      return { videoCount: "2~3개", targetElement: "제목·썸네일·첫 30초 중 1개", comparisonBasis: "수정 전후 반응률 비교" };
    case "keyword":
      return { videoCount: "다음 업로드 1개", targetElement: "태그 목록", comparisonBasis: "현재 태그 주제 적합도 기준" };
    case "content":
      return { videoCount: "2개", targetElement: "영상 길이 또는 포맷", comparisonBasis: "시청 유지율 그래프 비교" };
    case "growth":
      return { videoCount: "1~2개", targetElement: "반복 가능 포맷", comparisonBasis: "현재 중앙 조회수 기준" };
    default:
      return { videoCount: "1~2개", targetElement: "원인 신호 1개", comparisonBasis: "실행 전후 직접 측정" };
  }
}

/**
 * Gemini가 직접 생성한 growth_action_plan[] 항목을 액션 카드로 변환.
 * 템플릿 없이 Gemini 원문을 title로 사용하고, 카테고리 분류로 hint를 보완.
 */
function buildGeminiBackedActions(
  growthActionPlan: string[]
): Omit<ActionPlanCardVm, "priority">[] {
  const items = uniqueTrimmedStrings(growthActionPlan);
  return items.slice(0, 5).map((text, idx) => {
    const category = classifyTextItem(text);
    return {
      id: `gemini-action-${idx}`,
      title: makeDiagnosticLabel(text),
      whyNeeded: `튜브워치 분석이 채널 성장을 위해 직접 제안한 액션입니다. ${text}`,
      expectedEffect:
        "채널 데이터 전체를 종합해 도출한 제안으로, 현재 채널 구조에서 가장 직접적인 개선 방향입니다.",
      difficulty: "medium" as const,
      executionHint: buildTextExecutionHint(category),
      executionSpec: buildTextExecutionSpec(category),
    };
  });
}

/**
 * TODO(확장 수집): 경쟁 채널 DNA·사용자 진행도 등은
 * `getMenuExtensionStrategy("action_plan").futureCollectionFields` 범위에서만 보강한다.
 */
function buildTextBackedActions(
  weaknesses: string[],
  bottlenecks: string[]
): Omit<ActionPlanCardVm, "priority">[] {
  const wSet = uniqueTrimmedStrings(weaknesses);
  const bSet = uniqueTrimmedStrings(bottlenecks);
  const ordered: { kind: TextSourceKind; text: string }[] = [];
  const seen = new Set<string>();
  for (const text of wSet) {
    if (seen.has(text)) continue;
    seen.add(text);
    ordered.push({ kind: "weakness", text });
  }
  for (const text of bSet) {
    if (seen.has(text)) continue;
    seen.add(text);
    ordered.push({ kind: "bottleneck", text });
  }

  const out: Omit<ActionPlanCardVm, "priority">[] = [];
  let idx = 0;
  for (const item of ordered.slice(0, 8)) {
    const id = `text-${item.kind}-${idx}`;
    idx += 1;
    const category = classifyTextItem(item.text);
    out.push({
      id,
      title: titleFromText(item.text),
      whyNeeded: buildTextWhyNeeded(item.kind, category, item.text),
      expectedEffect: item.kind === "bottleneck"
        ? "병목 구간 해소는 업로드 주기 안정과 초반 클릭 유도력 보강에 유리한 구조로 이어질 수 있습니다."
        : "약점 신호 감소는 평균 조회수 유지력과 시청 지속시간 방어에 도움이 되는 방향으로 작용할 수 있습니다.",
      difficulty: item.kind === "bottleneck" ? "high" : "medium",
      executionHint: buildTextExecutionHint(category),
      executionSpec: buildTextExecutionSpec(category),
    });
  }
  return out;
}

function buildMetricBackedActions(
  sections: ChannelSectionScores | null,
  metrics: MetricsPartial | null
): Omit<ActionPlanCardVm, "priority">[] {
  if (!sections || !metrics) {
    return [];
  }
  const out: Omit<ActionPlanCardVm, "priority">[] = [];
  const threshold = 55;

  if (
    sections.channelActivity < threshold &&
    metrics.recent30dUploadCount != null &&
    Number.isFinite(metrics.recent30dUploadCount)
  ) {
    out.push({
      id: "metric-activity-uploads",
      title: "업로드 빈도 부족",
      whyNeeded: `채널 활동 패턴 구간 ${Math.round(sections.channelActivity)}점(기준 55점). 최근 30일 ${metrics.recent30dUploadCount}건은 알고리즘이 채널을 활성으로 분류하기에 부족해 노출 빈도가 줄어들고 있습니다.`,
      expectedEffect: "업로드 빈도 회복은 구독 전환 가능성과 반복 시청 가능성을 유지하는 데 유리한 구조입니다.",
      scenarioText:
        `최근 30일 ${metrics.recent30dUploadCount}건 업로드로 활동 신호가 알고리즘 임계점에 미치지 못하는 상태입니다.\n` +
        `업로드가 재개되면 활동 신호가 먼저 반응하고, 알고리즘이 채널을 활성 상태로 재분류합니다.\n` +
        `초기 노출 빈도 회복 → 기존 구독자 복귀율 안정화 → 신규 추천 범위 점진적 확장 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "이번 달 업로드 목표 횟수를 달력에 고정하세요.\n다음 영상 주제를 지금 바로 1개 정해두세요.",
      performancePrediction: {
        current: `채널 활동 패턴 구간 ${Math.round(sections.channelActivity)}점`,
        targetRange: "목표 55~65점",
        expectedChanges: ["활동 신호 회복", "알고리즘 노출 빈도 개선"],
        predictionBasis: `최근 30일 ${metrics.recent30dUploadCount}건 표본 기준`,
      },
      executionSpec: {
        videoCount: `다음 2~3회 업로드`,
        targetElement: "업로드 빈도",
        comparisonBasis: `현재 30일 ${metrics.recent30dUploadCount}건 기준`,
      },
    });
  }

  if (
    sections.channelActivity < threshold &&
    metrics.avgUploadIntervalDays != null &&
    Number.isFinite(metrics.avgUploadIntervalDays)
  ) {
    out.push({
      id: "metric-activity-interval",
      title: "업로드 리듬 불안정",
      whyNeeded: `채널 활동 패턴 구간 ${Math.round(sections.channelActivity)}점(기준 55점). 평균 업로드 간격 ${metrics.avgUploadIntervalDays.toFixed(1)}일로 구독자 기대 주기가 형성되지 않아 자연 이탈이 누적되고, 알고리즘도 추천 신호를 줄이고 있습니다.`,
      expectedEffect: "고정 주기가 자리 잡히면 반복 시청 가능성과 구독 전환 가능성을 함께 보강하는 방향으로 작용합니다.",
      scenarioText:
        `평균 업로드 간격 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일로 구독자의 기대 주기가 형성되지 않는 구조입니다.\n` +
        `간격이 일정해지면 구독자 복귀 패턴이 먼저 안정되고, 이후 알고리즘 추천 주기도 규칙화됩니다.\n` +
        `복귀율 개선 → 초기 반응 안정화 → 추천 노출 빈도 유지 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "기획·촬영·편집 중 병목 단계를 한 주 단위로 기록하세요.\n다음 2회 업로드 날짜를 지금 달력에 고정하세요.",
      performancePrediction: {
        current: `평균 업로드 간격 ${metrics.avgUploadIntervalDays.toFixed(1)}일`,
        targetRange: "목표 7~14일 내 고정 주기",
        expectedChanges: ["구독자 복귀 패턴 형성", "추천 노출 안정화"],
        predictionBasis: `표본 평균 간격 ${metrics.avgUploadIntervalDays.toFixed(1)}일 기준`,
      },
      executionSpec: {
        videoCount: "다음 3회 업로드",
        targetElement: "업로드 요일·간격",
        comparisonBasis: `현재 평균 간격 ${metrics.avgUploadIntervalDays.toFixed(1)}일 기준`,
      },
    });
  }

  if (
    sections.audienceResponse < threshold &&
    metrics.avgLikeRatio != null &&
    Number.isFinite(metrics.avgLikeRatio)
  ) {
    out.push({
      id: "metric-audience-like",
      title: "참여 반응 저하",
      whyNeeded: `시청자 반응 구조 구간 ${Math.round(sections.audienceResponse)}점(기준 55점). 평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}%로 반응 신호가 낮아, 알고리즘이 영상을 관련 시청자에게 추천하는 범위를 줄이고 있습니다.`,
      expectedEffect: "반응 신호 회복은 CTR 유지력과 평균 조회수 보강에 도움이 될 수 있습니다.",
      scenarioText:
        `표본 평균 좋아요 비율 약 ${(metrics.avgLikeRatio * 100).toFixed(2)}%로 반응 신호가 낮아 알고리즘 추천 범위가 좁은 상태입니다.\n` +
        `제목·썸네일·첫 30초 개선 시 CTR이 먼저 반응하고, 반응 신호 누적으로 추천 범위가 확장됩니다.\n` +
        `CTR 개선 → 반응 신호 누적 → 알고리즘 추천 범위 확장 → 신규 시청자 유입 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "medium",
      executionHint:
        "최근 영상 3개의 제목·썸네일·첫 30초를 비교하세요.\n차이가 가장 큰 요소 하나만 바꿔 다음 영상에서 반응을 측정하세요.",
      performancePrediction: {
        current: `평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}%`,
        targetRange: "목표 반응 신호 회복 (CTR·좋아요 동반 개선)",
        expectedChanges: ["반응 신호 누적", "알고리즘 추천 범위 확장"],
        predictionBasis: `표본 평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}% 기준`,
      },
      executionSpec: {
        videoCount: "2~3개",
        targetElement: "제목·썸네일·첫 30초 중 1개",
        comparisonBasis: `현재 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}% 기준`,
      },
    });
  }

  if (
    sections.contentStructure < threshold &&
    metrics.avgTitleLength != null &&
    Number.isFinite(metrics.avgTitleLength)
  ) {
    out.push({
      id: "metric-structure-title",
      title: "제목 키워드 배치 미흡",
      whyNeeded: `콘텐츠·구조 구간 ${Math.round(sections.contentStructure)}점(기준 55점). 평균 제목 길이 ${Math.round(metrics.avgTitleLength)}자로 핵심 키워드가 제목 뒤에 묻히는 구조일 경우 CTR이 낮아지고 노출 대비 유입이 줄어듭니다.`,
      expectedEffect: "핵심 키워드 위치 조정은 초반 클릭 유도력 보강에 직접 연결되어 CTR 개선에 도움이 될 수 있습니다.",
      scenarioText:
        `평균 제목 길이 약 ${Math.round(metrics.avgTitleLength)}자로 핵심 키워드 위치에 따라 클릭률에 영향을 줄 수 있는 구조입니다.\n` +
        `핵심 키워드를 앞 15자 안에 배치하면 CTR이 먼저 반응하고, CTR 개선이 노출 확대로 이어집니다.\n` +
        `CTR 개선 → 알고리즘 노출 확대 → 동일 주제 관련 영상 추천 빈도 상승 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "최근 영상 3개의 제목에서 핵심 키워드 위치를 확인하세요.\n핵심어가 앞 15자 안에 오도록 수정하고 다음 업로드에 적용하세요.",
      performancePrediction: {
        current: `평균 제목 길이 ${Math.round(metrics.avgTitleLength)}자`,
        targetRange: "목표 핵심 키워드 앞 15자 내 배치",
        expectedChanges: ["CTR 신호 개선", "알고리즘 노출 확대"],
        predictionBasis: `표본 평균 제목 길이 ${Math.round(metrics.avgTitleLength)}자 기준`,
      },
      executionSpec: {
        videoCount: "2~3개",
        targetElement: "제목 키워드 위치",
        comparisonBasis: "수정 전후 CTR 직접 비교",
      },
    });
  }

  if (
    (sections.contentStructure < threshold || sections.seoOptimization < threshold) &&
    metrics.avgTagCount != null &&
    Number.isFinite(metrics.avgTagCount)
  ) {
    out.push({
      id: "metric-tags",
      title: "키워드·태그 최적화 부족",
      whyNeeded: `평균 태그 수 ${metrics.avgTagCount.toFixed(1)}개. 태그가 많아도 주제와 맞지 않으면 잘못된 시청자에게 노출되어 발견성이 떨어집니다. 주제 적합 태그 5~10개가 무관 태그 다수보다 효과적입니다.`,
      expectedEffect: "주제 적합 태그 정리는 관심사 매칭 시청자 유입과 CTR 유지에 유리한 구조를 만드는 데 도움이 될 수 있습니다.",
      scenarioText:
        `평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개로 주제 적합도가 낮은 태그가 섞인 경우 잘못된 시청자에게 노출되는 구조입니다.\n` +
        `주제 적합 태그 정리 시 검색 노출 대상이 먼저 좁혀지고, 이후 클릭 반응률이 개선됩니다.\n` +
        `노출 대상 정교화 → 클릭 반응 개선 → 관심사 매칭 시청자 유입 증가 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "최근 영상 1개의 태그에서 주제 무관 태그를 제거하세요.\n핵심어·관련 검색어 5~10개만 남기고 다음 업로드에 그대로 적용하세요.",
      performancePrediction: {
        current: `평균 태그 수 ${metrics.avgTagCount.toFixed(1)}개`,
        targetRange: "목표 주제 적합 5~10개",
        expectedChanges: ["검색 발견성 개선", "관심사 매칭 시청자 유입"],
        predictionBasis: `표본 평균 태그 수 ${metrics.avgTagCount.toFixed(1)}개 기준`,
      },
      executionSpec: {
        videoCount: "다음 업로드 1개",
        targetElement: "태그 목록",
        comparisonBasis: "현재 태그 주제 적합도 기준",
      },
    });
  }

  if (
    sections.contentStructure < threshold &&
    metrics.avgVideoDuration != null &&
    Number.isFinite(metrics.avgVideoDuration)
  ) {
    const minutes = Math.floor(metrics.avgVideoDuration / 60);
    const seconds = Math.round(metrics.avgVideoDuration % 60);
    out.push({
      id: "metric-duration",
      title: "영상 길이 이탈 구간",
      whyNeeded: `콘텐츠·구조 구간 ${Math.round(sections.contentStructure)}점(기준 55점). 평균 영상 길이 ${minutes}분 ${seconds.toString().padStart(2, "0")}초로 주제 대비 구간이 늘어지면 시청 유지율이 낮아지고, 이탈 신호가 알고리즘 추천을 줄이는 방향으로 작용합니다.`,
      expectedEffect: "늘어지는 구간 제거는 시청 지속시간 방어와 초반 이탈 감소에 유리한 구조로 이어질 수 있습니다.",
      scenarioText:
        `평균 영상 길이 약 ${minutes}분 ${seconds.toString().padStart(2, "0")}초로 주제 대비 구간이 늘어지면 시청 유지율이 낮아지는 구조입니다.\n` +
        `불필요한 구간 제거 시 시청 유지율이 먼저 반응하고, 이탈 신호 감소가 추천 빈도로 이어집니다.\n` +
        `시청 유지율 개선 → 이탈 신호 감소 → 알고리즘 추천 유지 → 평균 노출 시간 확대 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "medium",
      executionHint:
        "최근 영상 2개에서 30초 이상 늘어지는 구간의 시간대를 기록하세요.\n다음 편집에서 그 구간을 줄이고 YouTube 스튜디오에서 시청 유지율 변화를 확인하세요.",
      performancePrediction: {
        current: `평균 영상 길이 ${minutes}분 ${seconds.toString().padStart(2, "0")}초`,
        targetRange: "목표 핵심 구간 단축 (늘어지는 구간 제거)",
        expectedChanges: ["시청 유지율 개선", "이탈 신호 감소"],
        predictionBasis: `표본 평균 영상 길이 ${minutes}분 ${seconds.toString().padStart(2, "0")}초 기준`,
      },
      executionSpec: {
        videoCount: "2개",
        targetElement: "영상 전체 길이",
        comparisonBasis: `현재 평균 ${minutes}분 기준`,
      },
    });
  }

  if (
    sections.growthMomentum < threshold &&
    metrics.medianViewCount != null &&
    Number.isFinite(metrics.medianViewCount)
  ) {
    out.push({
      id: "metric-growth-median",
      title: "조회 분포 편중",
      whyNeeded: `성장 모멘텀 구간 ${Math.round(sections.growthMomentum)}점(기준 55점). 중앙 조회수 ${Math.round(metrics.medianViewCount)}회로 채널 성과가 일부 히트 영상에 집중되어, 히트가 없으면 전체 조회가 급감하는 구조입니다.`,
      expectedEffect: "반복 가능한 포맷 정착은 평균 조회수 유지력과 주제 재현성을 함께 높이는 방향으로 작용합니다.",
      scenarioText:
        `표본 중앙 조회수 약 ${Math.round(metrics.medianViewCount)}회로 일부 히트 영상에 조회가 집중되는 구조로 볼 수 있습니다.\n` +
        `반복 가능한 포맷 실험 시 중간 성과 영상 수가 먼저 늘어나고, 전체 조회 분포가 고르게 됩니다.\n` +
        `중간 성과 영상 증가 → 조회 분포 안정화 → 히트 의존도 감소 → 채널 구조 안정화 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "high",
      executionHint:
        "상위·하위 영상 3개씩 비교해 반복 가능한 포맷 1개를 선택하세요.\n다음 1편에서 그 포맷으로 업로드하고 결과를 중앙 조회수와 비교하세요.",
      performancePrediction: {
        current: `중앙 조회수 약 ${Math.round(metrics.medianViewCount)}회`,
        targetRange: "목표 중앙값 점진적 회복",
        expectedChanges: ["중간 성과 영상 증가", "히트 의존도 감소"],
        predictionBasis: `표본 중앙 조회수 ${Math.round(metrics.medianViewCount)}회 기준`,
      },
      executionSpec: {
        videoCount: "1~2개",
        targetElement: "반복 가능 포맷",
        comparisonBasis: `현재 중앙 조회수 ${Math.round(metrics.medianViewCount)}회 기준`,
      },
    });
  }

  if (
    sections.subscriptionConversion != null &&
    sections.subscriptionConversion < threshold &&
    metrics.avgLikeRatio != null &&
    Number.isFinite(metrics.avgLikeRatio)
  ) {
    out.push({
      id: "metric-subscription-conversion",
      title: "구독 전환 구조 약화",
      whyNeeded: `구독 전환 구조 구간 ${Math.round(sections.subscriptionConversion)}점(기준 55점). 평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}%로 참여 신호가 낮아, 시청자가 영상을 보고도 구독으로 이어지는 흐름이 형성되지 않고 있습니다.`,
      expectedEffect: "참여를 유도하는 콘텐츠 구조와 일관된 업로드는 시청자 신뢰를 높여 구독 전환율을 점진적으로 개선합니다.",
      scenarioText:
        `평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}%로 참여 신호가 구독 전환에 충분하지 않은 수준입니다.\n` +
        `영상 말미 구독 유도 + 일관된 주제·업로드 주기 정착 시 참여 신호가 먼저 회복됩니다.\n` +
        `참여율 개선 → 시청자 신뢰 형성 → 구독 전환 흐름 강화 → 구독자 기반 안정화 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "medium",
      executionHint:
        "영상 마지막 30초에 구독 유도 멘트(구체적 이유 포함)를 추가하세요.\n동일 주제·포맷을 3회 이상 반복해 '다음 편 기대'를 형성하세요.",
      performancePrediction: {
        current: `구독 전환 구조 ${Math.round(sections.subscriptionConversion)}점`,
        targetRange: "목표 55~65점",
        expectedChanges: ["참여율 신호 개선", "구독 전환 흐름 강화"],
        predictionBasis: `평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}% 기준`,
      },
      executionSpec: {
        videoCount: "다음 2~3개",
        targetElement: "구독 유도 구조 + 주제 반복",
        comparisonBasis: "적용 전후 좋아요 비율 비교",
      },
    });
  }

  return dedupeMetricActionsById(out);
}

function dedupeMetricActionsById(
  items: Omit<ActionPlanCardVm, "priority">[]
): Omit<ActionPlanCardVm, "priority">[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

function assignPriorities(
  cards: Omit<ActionPlanCardVm, "priority">[]
): ActionPlanCardVm[] {
  const n = cards.length;
  if (n === 0) return [];
  return cards.map((c, i) => {
    let priority: ActionPlanPriority;
    if (n === 1) {
      priority = "P1";
    } else if (n === 2) {
      priority = i === 0 ? "P1" : "P2";
    } else {
      const p1End = Math.max(1, Math.ceil(n / 3));
      const p2End = Math.max(p1End + 1, Math.ceil((n * 2) / 3));
      if (i < p1End) priority = "P1";
      else if (i < p2End) priority = "P2";
      else priority = "P3";
    }
    return { ...c, priority };
  });
}

type SortableActionCandidate = Omit<ActionPlanCardVm, "priority"> & {
  sortTier: number;
  sortOrder: number;
};

function toSortableMetricAndText(
  cards: Omit<ActionPlanCardVm, "priority">[],
  tier: number,
  orderStart: number
): SortableActionCandidate[] {
  return cards.map((c, i) => ({
    ...c,
    sortTier: tier,
    sortOrder: orderStart + i,
  }));
}

function channelDnaRowsToSortable(
  rows: ChannelDnaActionCandidate[]
): SortableActionCandidate[] {
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    whyNeeded: b.whyNeeded,
    expectedEffect: b.expectedEffect,
    difficulty: b.difficulty,
    executionHint: b.executionHint,
    evidenceSource: "channel_dna" as const,
    scenarioText: b.scenarioText,
    performancePrediction: b.performancePrediction,
    executionSpec: b.executionSpec,
    sortTier: b.sortTier,
    sortOrder: b.sortOrder,
  }));
}

/**
 * 우선순위: 1 채널 DNA 히트 → 2 Gemini 직접 제안 → 3 편차·업로드 → 4 수치 기반 메트릭 → 5 강점 확장 → 6 텍스트 약점·병목
 */
function mergePrioritizedActionStack(
  channelDnaRows: ChannelDnaActionCandidate[],
  metricActions: Omit<ActionPlanCardVm, "priority">[],
  textActions: Omit<ActionPlanCardVm, "priority">[],
  geminiActions: Omit<ActionPlanCardVm, "priority">[] = []
): Omit<ActionPlanCardVm, "priority">[] {
  const bench = channelDnaRowsToSortable(channelDnaRows);
  const geminiS = toSortableMetricAndText(geminiActions, 2, 0);
  const metricS = toSortableMetricAndText(metricActions, 4, 100);
  const textS = toSortableMetricAndText(textActions, 6, 0);
  const all: SortableActionCandidate[] = [...bench, ...geminiS, ...metricS, ...textS];
  all.sort((a, b) => a.sortTier - b.sortTier || a.sortOrder - b.sortOrder);

  const seenId = new Set<string>();
  const seenKey = new Set<string>();
  const out: Omit<ActionPlanCardVm, "priority">[] = [];
  for (const item of all) {
    if (seenId.has(item.id)) {
      continue;
    }
    const key = `${item.title}|${item.whyNeeded.slice(0, 120)}`;
    if (seenKey.has(key)) {
      continue;
    }
    seenKey.add(key);
    seenId.add(item.id);
    const { sortTier: _st, sortOrder: _so, ...card } = item;
    out.push(card);
    if (out.length >= 9) {
      break;
    }
  }
  return out;
}

function buildChecklist(
  metrics: MetricsPartial | null,
  flags: string[]
): ActionPlanChecklistVm[] {
  const items: ActionPlanChecklistVm[] = [];

  if (metrics?.avgUploadIntervalDays != null && Number.isFinite(metrics.avgUploadIntervalDays)) {
    items.push({
      id: "chk-upload-interval",
      title: "업로드 간격",
      description: `표본 평균 간격 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일 — 목표 주기와 7일 이상 차이가 나지 않나요?`,
      difficulty: "easy",
    });
  }

  if (metrics?.recent30dUploadCount != null && Number.isFinite(metrics.recent30dUploadCount)) {
    items.push({
      id: "chk-recent-uploads",
      title: "최근 30일 업로드 수",
      description: `최근 30일 ${Math.round(metrics.recent30dUploadCount)}건 — 이번 달 목표 횟수를 달력에 적어뒀나요?`,
      difficulty: "easy",
    });
  }

  if (metrics?.avgTitleLength != null && Number.isFinite(metrics.avgTitleLength)) {
    items.push({
      id: "chk-title-len",
      title: "제목 구조·길이",
      description: `평균 제목 길이 약 ${Math.round(metrics.avgTitleLength)}자 — 최근 3개 제목에서 핵심 키워드가 앞 15자 안에 있나요?`,
      difficulty: "easy",
    });
  }

  if (metrics?.avgVideoDuration != null && Number.isFinite(metrics.avgVideoDuration)) {
    const m = Math.floor(metrics.avgVideoDuration / 60);
    const s = Math.round(metrics.avgVideoDuration % 60);
    items.push({
      id: "chk-duration",
      title: "영상 길이",
      description: `평균 ${m}분 ${s.toString().padStart(2, "0")}초 — 최근 영상 중 내용이 반복되거나 늘어지는 구간이 있나요?`,
      difficulty: "medium",
    });
  }

  if (flags.includes("repeated_topic_pattern")) {
    items.push({
      id: "chk-format-repeat",
      title: "반복 포맷·주제 패턴",
      description:
        "반복 주제 패턴이 감지됐습니다 — 의도한 시리즈인가요, 아니면 주제 다양성이 줄어든 건가요?",
      difficulty: "medium",
    });
  }

  if (
    flags.includes("short_video_dominant") ||
    flags.includes("long_video_dominant")
  ) {
    items.push({
      id: "chk-length-mix",
      title: "영상 길이 편중",
      description:
        "특정 길이 영상이 편중됐습니다 — 현재 포맷 비중이 채널 성장 방향과 맞나요?",
      difficulty: "medium",
    });
  }

  if (metrics?.avgTagCount != null && Number.isFinite(metrics.avgTagCount)) {
    items.push({
      id: "chk-tags",
      title: "태그·키워드 사용",
      description: `평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개 — 주제와 무관한 태그가 절반 이상 섞여 있지 않나요?`,
      difficulty: "easy",
    });
  }

  return items;
}

function buildCautions(weaknesses: string[], bottlenecks: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of uniqueTrimmedStrings(bottlenecks)) {
    const line = `${t} (병목 주의)`;
    if (seen.has(line) || out.length >= 5) continue;
    seen.add(line);
    out.push(line);
  }
  for (const t of uniqueTrimmedStrings(weaknesses)) {
    const line = `${t} (약점 유의)`;
    if (seen.has(line) || out.length >= 6) break;
    seen.add(line);
    out.push(line);
  }
  return out;
}

function sectionLinesFrom(
  sections: ChannelSectionScores | null
): ActionPlanSectionLineVm[] {
  if (!sections) return [];
  return (Object.keys(SECTION_LABELS) as (keyof ChannelSectionScores)[])
    .filter((k) => sections[k] != null)
    .map((k) => ({
      label: SECTION_LABELS[k] ?? k,
      score: Math.round(sections[k] as number),
    }));
}

/**
 * NormalizedSnapshotVideo 배열로 SEO 키워드 진단 ViewModel 계산.
 * 상위 성과 영상의 태그를 황금 키워드로, 하위 영상에 없는 것을 누락 키워드로 분류.
 */
function buildSeoKeywordVm(videos: NormalizedSnapshotVideo[]): SeoKeywordVm | null {
  if (videos.length === 0) return null;

  const withViews = videos.filter((v) => v.viewCount != null);

  // 태그 데이터 보유 여부 확인
  const hasTagData = videos.some((v) => v.tags.length > 0);

  // 설명란 통계 (태그 없어도 계산 가능)
  const withDesc = videos.filter((v) => v.descriptionLength != null);
  let descriptionStats: SeoKeywordVm["descriptionStats"] = null;
  if (withDesc.length > 0) {
    const avg = Math.round(
      withDesc.reduce((s, v) => s + (v.descriptionLength ?? 0), 0) / withDesc.length
    );
    const shortCount = withDesc.filter((v) => (v.descriptionLength ?? 0) < 100).length;
    const goodCount = withDesc.filter((v) => (v.descriptionLength ?? 0) >= 300).length;
    let status: "too_short" | "moderate" | "good";
    let guideText: string;
    if (avg < 100) {
      status = "too_short";
      guideText = "설명란이 평균 100자 미만입니다. 주제 요약 + 링크 + 키워드를 포함해 300자 이상으로 보완하세요.";
    } else if (avg < 300) {
      status = "moderate";
      guideText = "설명란이 보통 수준입니다. 검색 노출을 높이려면 300자 이상, 핵심 키워드 2~3개를 첫 문단에 배치하세요.";
    } else {
      status = "good";
      guideText = "설명란 길이가 충분합니다. 첫 2줄 안에 핵심 키워드가 포함되어 있는지 확인하세요.";
    }
    descriptionStats = { avgLength: avg, shortCount, goodCount, totalCount: withDesc.length, status, guideText };
  }

  if (!hasTagData) {
    return { goldenKeywords: [], missingKeywords: [], descriptionStats, hasTagData: false, sampleSize: videos.length };
  }

  // 조회수 기준 상위/하위 분류 (중앙값 기준)
  const sorted = [...withViews].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  const medianIdx = Math.floor(sorted.length / 2);
  const median = sorted[medianIdx]?.viewCount ?? 0;

  const topVideos = sorted.filter((v) => (v.viewCount ?? 0) >= median);
  const bottomVideos = sorted.filter((v) => (v.viewCount ?? 0) < median);

  // 황금 키워드: 상위 영상 태그 빈도 + 평균 조회수
  const tagStats = new Map<string, { count: number; totalViews: number }>();
  for (const v of topVideos) {
    for (const tag of v.tags) {
      const key = tag.trim().toLowerCase();
      if (!key) continue;
      const existing = tagStats.get(key) ?? { count: 0, totalViews: 0 };
      tagStats.set(key, {
        count: existing.count + 1,
        totalViews: existing.totalViews + (v.viewCount ?? 0),
      });
    }
  }
  const goldenKeywords = Array.from(tagStats.entries())
    .map(([tag, stat]) => ({
      tag,
      usageCount: stat.count,
      avgViews: Math.round(stat.totalViews / stat.count),
    }))
    .sort((a, b) => b.usageCount - a.usageCount || b.avgViews - a.avgViews)
    .slice(0, 12);

  // 누락 키워드: 상위에만 있고 하위에는 없는 태그
  const bottomTagSet = new Set<string>();
  for (const v of bottomVideos) {
    for (const tag of v.tags) {
      bottomTagSet.add(tag.trim().toLowerCase());
    }
  }
  const missingKeywords = goldenKeywords
    .filter((k) => !bottomTagSet.has(k.tag))
    .slice(0, 6)
    .map((k) => ({ tag: k.tag, topOnlyCount: k.usageCount }));

  return { goldenKeywords, missingKeywords, descriptionStats, hasTagData, sampleSize: videos.length };
}

function buildSeoDeficitVm(videos: NormalizedSnapshotVideo[]): SeoDeficitVm | null {
  if (videos.length === 0) return null;
  const total = videos.length;
  const shortDesc = videos.filter(
    (v) => v.descriptionLength != null && v.descriptionLength < 100
  ).length;
  const lowTag = videos.filter((v) => v.tags.length < 3).length;
  if (shortDesc === 0 && lowTag === 0) return null;
  return {
    totalCount: total,
    shortDescCount: shortDesc,
    shortDescPercent: Math.round((shortDesc / total) * 100),
    lowTagCount: lowTag,
    lowTagPercent: Math.round((lowTag / total) * 100),
  };
}

function buildEngagementGapVm(videos: NormalizedSnapshotVideo[]): EngagementGapVm | null {
  const valid = videos.filter(
    (v) => v.viewCount != null && v.viewCount > 0 && v.likeCount != null
  );
  if (valid.length < 4) return null;

  // 영상별 좋아요 비율 계산
  const likeRates = valid
    .map((v) => (v.likeCount ?? 0) / (v.viewCount ?? 1))
    .sort((a, b) => a - b);

  const avgLikeRate =
    likeRates.reduce((s, r) => s + r, 0) / likeRates.length;

  // 표본 내 중앙값 대비 분위 판정
  const median = likeRates[Math.floor(likeRates.length / 2)] ?? 0;
  const p25 = likeRates[Math.floor(likeRates.length * 0.25)] ?? 0;
  const p75 = likeRates[Math.floor(likeRates.length * 0.75)] ?? 0;

  let percentileLabel: string;
  let hasLowEngagement: boolean;

  if (avgLikeRate <= p25) {
    percentileLabel = "하위 25%";
    hasLowEngagement = true;
  } else if (avgLikeRate <= median) {
    percentileLabel = "하위 50%";
    hasLowEngagement = true;
  } else if (avgLikeRate <= p75) {
    percentileLabel = "상위 50%";
    hasLowEngagement = false;
  } else {
    percentileLabel = "상위 25%";
    hasLowEngagement = false;
  }

  return {
    avgLikeRate,
    percentileLabel,
    hasLowEngagement,
    sampleCount: valid.length,
  };
}

const TITLE_STOPWORDS = new Set([
  "이것", "그것", "저것", "이런", "그런", "저런", "어떤", "모든",
  "에서", "에게", "부터", "까지", "하면", "하고", "그리고", "하지만",
  "또는", "그래서", "때문", "위해", "대한", "관한", "있는", "없는",
  "되는", "하는", "으로", "으로서", "위한", "대해", "이라고", "라고",
  "영상", "채널", "유튜브", "youtube", "동영상", "구독", "시청",
  "the", "and", "for", "this", "that", "with", "from", "are", "was",
]);

function tokenizeTitle(title: string): string[] {
  return title
    .split(/[\s\[\]\(\)\{\}\!\?\.\,\:\;\'\"\-\_\/\|\~\`\^\+\=]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !TITLE_STOPWORDS.has(t));
}

function buildLinguisticInsightVm(
  videos: NormalizedSnapshotVideo[]
): LinguisticInsightVm | null {
  const withViews = videos.filter(
    (v) => v.viewCount != null && v.viewCount >= 0 && v.title.length > 0
  );
  if (withViews.length < 5) return null;

  const sorted = [...withViews].sort(
    (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
  );
  // 상위 25% (최소 2편)
  const topCount = Math.max(2, Math.ceil(sorted.length * 0.25));
  const topVideos = sorted.slice(0, topCount);

  // 상위/전체 제목 토큰 빈도 집계 (영상당 중복 제거)
  const topFreq = new Map<string, number>();
  const allFreq = new Map<string, number>();

  for (const v of topVideos) {
    for (const tok of Array.from(new Set(tokenizeTitle(v.title)))) {
      topFreq.set(tok, (topFreq.get(tok) ?? 0) + 1);
    }
  }
  for (const v of withViews) {
    for (const tok of Array.from(new Set(tokenizeTitle(v.title)))) {
      allFreq.set(tok, (allFreq.get(tok) ?? 0) + 1);
    }
  }

  const results: { keyword: string; liftPercent: number }[] = [];
  for (const [tok, tf] of Array.from(topFreq.entries())) {
    if (tf < 2) continue; // 상위 영상 최소 2편에서 등장해야 의미 있음
    const af = allFreq.get(tok) ?? 0;
    const topRate = tf / topCount;
    const allRate = af / withViews.length;
    if (allRate === 0) continue;
    const lift = (topRate - allRate) / allRate;
    if (lift < 0.1) continue; // 10% 이상 lift만 포함
    results.push({ keyword: tok, liftPercent: Math.round(lift * 100) });
  }

  if (results.length === 0) return null;

  return {
    ctrBoosters: results
      .sort((a, b) => b.liftPercent - a.liftPercent)
      .slice(0, 6),
    topSampleCount: topCount,
    totalSampleCount: withViews.length,
  };
}

export function buildActionPlanPageViewModel(
  data: AnalysisPageData | null
): ActionPlanPageViewModel {
  const ext = buildDefaultMarketExtensionSlice();
  const empty: ActionPlanPageViewModel = {
    ...ext,
    ...deriveExtensionMenuFields(null, "action_plan"),
    analysisRunsLoaded: deriveAnalysisRunsLoaded(null),
    ...pickYoutubeAccessFieldsFromPageData(null),
    limitNotice: null,
    hasChannel: false,
    hasAnalysis: false,
    selectedChannelId: null,
    channelTitle: null,
    totalScore: null,
    sectionLines: [],
    actions: [],
    checklistItems: [],
    cautions: [],
    sampleSizeNote: null,
    analysisConfidence: null,
    strategicComment: null,
    seoKeywords: null,
    seoDeficit: null,
    engagementGap: null,
    linguisticInsight: null,
  };

  if (!data || data.channels.length === 0 || !data.selectedChannel) {
    return {
      ...empty,
      ...deriveExtensionMenuFields(data, "action_plan"),
      analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
      ...pickYoutubeAccessFieldsFromPageData(data),
      hasChannel: false,
      limitNotice:
        "연결된 채널이 없습니다. 설정에서 채널을 연결한 뒤 다시 열어 주세요.",
    };
  }

  const ch = data.selectedChannel;
  const title = ch.channel_title ?? null;

  if (!data.latestResult) {
    return {
      ...empty,
      ...deriveExtensionMenuFields(data, "action_plan"),
      analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
      ...pickYoutubeAccessFieldsFromPageData(data),
      hasChannel: true,
      hasAnalysis: false,
      selectedChannelId: ch.id,
      channelTitle: title,
      limitNotice:
        "이 채널에 저장된 분석 결과가 없습니다. /analysis에서 분석을 실행·완료한 뒤 다시 확인하세요.",
    };
  }

  const row = enrichRowScores(data.latestResult);

  // 공통 정규화 레이어: raw snapshot → NormalizedSnapshot (단일 진입점)
  const normalized = normalizeFeatureSnapshot(row.feature_snapshot);
  const metrics = normalized.metrics as MetricsPartial | null;
  const flags = normalized.patterns;
  const sections = parseSectionScores(row.feature_section_scores);

  const totalRaw = row.feature_total_score;
  const totalScore =
    typeof totalRaw === "number" && Number.isFinite(totalRaw)
      ? Math.max(0, Math.min(100, totalRaw))
      : null;

  const weaknesses = safeStringArray(row.weaknesses);
  const bottlenecks = safeStringArray(row.bottlenecks);
  const growthActionPlan = safeStringArray(row.growth_action_plan);

  const internalChannelDnaSummary = buildInternalChannelDnaSummary(data);
  const channelDnaSignals = pickChannelDnaSignalsForActionPlan(internalChannelDnaSummary);

  const geminiActions = buildGeminiBackedActions(growthActionPlan);
  const textActions = buildTextBackedActions(weaknesses, bottlenecks);
  const metricActions = buildMetricBackedActions(sections, metrics);
  const channelDnaRows = buildChannelDnaActionCandidates(channelDnaSignals, sections);
  const metricActionsFiltered = filterMetricActionsSupersededByChannelDna(
    metricActions,
    channelDnaRows
  );
  // Gemini 직접 제안(tier 2)은 channelDna(tier 1) 다음, metric(tier 4)·text(tier 6) 이전
  let merged = mergePrioritizedActionStack(
    channelDnaRows,
    metricActionsFiltered,
    textActions,
    geminiActions
  );

  if (merged.length === 0 && sections != null) {
    const keys = (
      Object.keys(SECTION_LABELS) as (keyof ChannelSectionScores)[]
    ).filter((k) => (sections[k] ?? 100) < 50);
    if (keys.length > 0) {
      const labels = keys.map((k) => SECTION_LABELS[k]).join(", ");
      merged = [
        {
          id: "fallback-low-sections",
          title: "저장된 구간 점수 재확인",
          whyNeeded: `다음 구간 점수가 50 미만으로 기록되었습니다: ${labels}. 세부 수치는 채널 분석 결과에서 확인할 수 있습니다.`,
          expectedEffect: CONSERVATIVE_EFFECT,
          difficulty: "medium" as const,
          executionHint:
            "구간 점수와 표본 지표를 함께 검토하고, 원인 가설을 한 가지만 정한 뒤 작은 실험을 계획하세요.",
        },
      ];
    }
  }

  const actions = assignPriorities(merged);

  const checklistItems = buildChecklist(metrics, flags);
  const cautions = buildCautions(weaknesses, bottlenecks);

  const sampleNote =
    typeof row.sample_size_note === "string" ? row.sample_size_note : null;
  const confidenceRaw = row.analysis_confidence;
  const analysisConfidence =
    confidenceRaw === "low" ||
    confidenceRaw === "medium" ||
    confidenceRaw === "high"
      ? confidenceRaw
      : null;

  let limitNotice: string | null = null;
  if (!metrics) {
    limitNotice =
      "스냅샷 메트릭이 없어 체크리스트·일부 수치 기반 제안이 제한됩니다.";
  } else if (analysisConfidence === "low") {
    limitNotice =
      "분석 신뢰도가 낮게 기록되었습니다. 아래 제안은 참고용 우선순위일 뿐입니다.";
  }
  if (
    channelDnaRows.length === 0 &&
    textActions.length === 0 &&
    metricActions.length === 0 &&
    actions.length <= 1
  ) {
    const extra =
      "저장된 약점·병목 문구와 수치·채널 패턴 근거가 거의 없어 제안 범위가 매우 좁습니다.";
    limitNotice = limitNotice ? `${limitNotice} ${extra}` : extra;
  }

  if (channelDnaRows.length > 0) {
    const benchLine =
      "일부 우선순위 카드는 채널 DNA와 동일한 저장 스냅샷에서 계산된 내부 신호를 근거로 합니다.";
    limitNotice = limitNotice ? `${limitNotice} ${benchLine}` : benchLine;
  }

  if (actions.length === 0) {
    const base =
      "현재 확보된 데이터 기준으로 우선순위 액션 카드를 구성할 수 없습니다. 채널 분석 결과를 먼저 확인하세요.";
    limitNotice = limitNotice ? `${limitNotice} ${base}` : base;
  }

  const strategicComment = buildActionPlanStrategicComment(actions, totalScore, cautions);
  const seoKeywords = buildSeoKeywordVm(normalized.videos);
  const seoDeficit = buildSeoDeficitVm(normalized.videos);
  const engagementGap = buildEngagementGapVm(normalized.videos);
  const linguisticInsight = buildLinguisticInsightVm(normalized.videos);

  return {
    ...ext,
    ...deriveExtensionMenuFields(data, "action_plan"),
    analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
    ...pickYoutubeAccessFieldsFromPageData(data),
    limitNotice,
    hasChannel: true,
    hasAnalysis: true,
    selectedChannelId: ch.id,
    channelTitle: title,
    totalScore,
    sectionLines: sectionLinesFrom(sections),
    actions,
    checklistItems,
    cautions,
    sampleSizeNote: sampleNote,
    analysisConfidence,
    strategicComment,
    seoKeywords,
    seoDeficit,
    engagementGap,
    linguisticInsight,
  };
}

function buildActionPlanStrategicComment(
  actions: ActionPlanCardVm[],
  totalScore: number | null,
  cautions: string[]
): StrategicCommentVm | null {
  if (actions.length === 0) return null;

  const p1 = actions.filter((a) => a.priority === "P1");
  const p2 = actions.filter((a) => a.priority === "P2");

  const headline =
    p1.length > 0
      ? `P1 우선 실행 — ${p1[0].title}`
      : `총 ${actions.length}개 실행 액션 정리됨`;

  const p3 = actions.filter((a) => a.priority === "P3");
  const summaryParts: string[] = [];
  summaryParts.push(
    `총 ${actions.length}개 액션이 P1(${p1.length}개) · P2(${p2.length}개) · P3(${p3.length}개)로 나뉩니다.`
  );
  summaryParts.push(
    `P1은 지금 당장 막힌 병목을 해결하는 핵심 실행입니다. P2는 초기 반응을 안정화하고 구조를 보완합니다. P3는 업로드 전 점검할 세부 최적화 항목입니다.`
  );
  if (totalScore != null) {
    summaryParts.push(`현재 채널 종합 점수 ${Math.round(totalScore)}점 기준으로 도출된 제안입니다.`);
  }

  const takeaways = actions.slice(0, 3).map((a) => `[${a.priority}] ${a.title}`);

  return {
    headline,
    summary: summaryParts.join(" "),
    keyTakeaways: takeaways,
    priorityAction: p1[0]?.executionHint ?? null,
    caution: cautions[0] ?? null,
  };
}
