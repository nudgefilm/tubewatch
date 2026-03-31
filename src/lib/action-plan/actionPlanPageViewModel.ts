/**
 * Action Plan 화면은 `analysis_results` 베이스 스냅샷만으로 카드·체크리스트를 구성한다.
 * 확장 범위·향후 수집 필드: `@/lib/analysis/menuExtensionDataStrategy` 의 `action_plan`.
 */
import type {
  AnalysisPageData,
  AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import { normalizeFeatureSnapshot } from "@/lib/analysis/normalizeSnapshot";
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
} & MarketExtensionSliceVm;

export type ChannelSectionScores = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
};

type MetricsPartial = Partial<Record<keyof ChannelMetrics, number>>;

const SECTION_LABELS: Record<keyof ChannelSectionScores, string> = {
  channelActivity: "업로드·활동",
  audienceResponse: "조회·반응",
  contentStructure: "콘텐츠·구조",
  seoOptimization: "메타·발견성",
  growthMomentum: "성장 신호",
};

const CONSERVATIVE_EFFECT =
  "2~3회 업로드 후 조회·반응 변화를 직접 측정하면, 어느 요소가 실제로 작동하는지 확인할 수 있습니다.";

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
    const label = item.kind === "weakness" ? "분석 약점" : "분석 병목";
    const id = `text-${item.kind}-${idx}`;
    idx += 1;
    out.push({
      id,
      title: titleFromText(item.text),
      whyNeeded: `${item.kind === "weakness" ? "약점 신호" : "병목 지점"}으로 진단된 구간입니다. ${item.text} — 이 패턴이 지속되면 성과 회복이 어려워집니다.`,
      expectedEffect: item.kind === "bottleneck"
        ? "병목이 해소되면 콘텐츠 제작 흐름이 안정되고, 그 결과가 업로드 주기·품질로 이어집니다."
        : "약점 요인을 하나씩 줄이면 전체 구간 점수가 회복되고 알고리즘 추천 신호가 강화됩니다.",
      scenarioText: item.kind === "bottleneck"
        ? `현재 병목으로 진단된 구간으로 제작 흐름 또는 성과 회복에 제동이 걸린 상태입니다.\n` +
          `병목이 해소되면 콘텐츠 제작 주기가 먼저 안정되고, 이후 업로드 일관성이 회복됩니다.\n` +
          `제작 주기 안정화 → 업로드 일관성 회복 → 활동 신호 개선 순으로 변화가 나타날 수 있습니다.`
        : `현재 약점 신호로 진단된 구간으로 성과 불안정 요인이 남아 있는 상태입니다.\n` +
          `해당 요인을 개선하면 구간 점수 신호가 먼저 반응하고, 전체 추천 신호 안정성이 높아집니다.\n` +
          `구간 신호 개선 → 성과 구조 안정화 → 알고리즘 추천 신호 강화 순으로 변화가 나타날 수 있습니다.`,
      difficulty: item.kind === "bottleneck" ? "high" : "medium",
      executionHint:
        "이 신호를 유발하는 원인을 하나로 좁히세요.\n다음 1~2회 업로드에서 그 요소만 바꿔 결과를 기록하세요.",
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
      title: "업로드 빈도 복구 — 활동 구간이 기준 이하입니다",
      whyNeeded: `업로드·활동 구간 ${Math.round(sections.channelActivity)}점(기준 55점). 최근 30일 ${metrics.recent30dUploadCount}건 업로드는 알고리즘이 채널을 활성으로 분류하기에 부족할 수 있습니다. 업로드 공백이 길어질수록 채널 노출 빈도가 감소합니다.`,
      expectedEffect: "업로드 주기가 안정되면 알고리즘이 채널을 활성으로 인식해 노출 빈도가 회복됩니다. 구독자 복귀율과 신규 추천 트리거에 직접 영향을 줍니다.",
      scenarioText:
        `최근 30일 ${metrics.recent30dUploadCount}건 업로드로 활동 신호가 알고리즘 임계점에 미치지 못하는 상태입니다.\n` +
        `업로드가 재개되면 활동 신호가 먼저 반응하고, 알고리즘이 채널을 활성 상태로 재분류합니다.\n` +
        `초기 노출 빈도 회복 → 기존 구독자 복귀율 안정화 → 신규 추천 범위 점진적 확장 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "이번 달 업로드 목표 횟수를 달력에 고정하세요.\n촬영·편집 일정을 역산해 공백이 2주를 넘지 않도록 조정하세요.\n다음 영상 주제를 지금 바로 1개 정해두세요.",
    });
  }

  if (
    sections.channelActivity < threshold &&
    metrics.avgUploadIntervalDays != null &&
    Number.isFinite(metrics.avgUploadIntervalDays)
  ) {
    out.push({
      id: "metric-activity-interval",
      title: "업로드 간격 단축 — 불규칙한 주기가 이탈을 만듭니다",
      whyNeeded: `표본 기준 평균 업로드 간격 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일. 간격이 고르지 않으면 구독자의 기대 주기가 형성되지 않아 자연 이탈이 발생합니다. 알고리즘도 업로드 주기가 불규칙한 채널에는 추천 신호를 줄이는 경향이 있습니다.`,
      expectedEffect: "일정한 간격이 구독자의 복귀 패턴을 만들고, 알고리즘 추천 빈도를 안정적으로 유지하는 기반이 됩니다.",
      scenarioText:
        `평균 업로드 간격 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일로 구독자의 기대 주기가 형성되지 않는 구조입니다.\n` +
        `간격이 일정해지면 구독자 복귀 패턴이 먼저 안정되고, 이후 알고리즘 추천 주기도 규칙화됩니다.\n` +
        `복귀율 개선 → 초기 반응 안정화 → 추천 노출 빈도 유지 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "기획·촬영·편집 중 어느 단계에서 병목이 생기는지 한 주 단위로 기록하세요.\n병목 단계 하나만 골라 시간을 줄일 방법을 실험하세요.\n목표 간격을 정하고 달력에 다음 2회 업로드 날짜를 고정하세요.",
    });
  }

  if (
    sections.audienceResponse < threshold &&
    metrics.avgLikeRatio != null &&
    Number.isFinite(metrics.avgLikeRatio)
  ) {
    out.push({
      id: "metric-audience-like",
      title: "반응률 회복 — 조회 대비 좋아요가 낮습니다",
      whyNeeded: `조회·반응 구간 ${Math.round(sections.audienceResponse)}점(기준 55점). 표본 평균 좋아요 비율 약 ${(metrics.avgLikeRatio * 100).toFixed(2)}%. 반응률이 낮으면 알고리즘이 영상을 관련 시청자에게 추천하는 범위를 줄입니다.`,
      expectedEffect: "좋아요 비율이 올라가면 알고리즘이 해당 영상을 더 넓은 범위에 추천하여 신규 시청자 유입이 증가합니다.",
      scenarioText:
        `표본 평균 좋아요 비율 약 ${(metrics.avgLikeRatio * 100).toFixed(2)}%로 반응 신호가 낮아 알고리즘 추천 범위가 좁은 상태입니다.\n` +
        `제목·썸네일·첫 30초 개선 시 CTR이 먼저 반응하고, 반응 신호 누적으로 추천 범위가 확장됩니다.\n` +
        `CTR 개선 → 반응 신호 누적 → 알고리즘 추천 범위 확장 → 신규 시청자 유입 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "medium",
      executionHint:
        "최근 영상 3개의 제목·썸네일·첫 30초를 비교하세요.\n반응이 가장 높은 영상과 낮은 영상의 차이를 한 줄로 적어두세요.\n다음 영상에서 차이점 중 하나만 바꿔 반응 변화를 측정하세요.",
    });
  }

  if (
    sections.contentStructure < threshold &&
    metrics.avgTitleLength != null &&
    Number.isFinite(metrics.avgTitleLength)
  ) {
    out.push({
      id: "metric-structure-title",
      title: "제목 구조 개선 — 핵심 키워드가 앞으로 와야 합니다",
      whyNeeded: `콘텐츠·구조 구간 ${Math.round(sections.contentStructure)}점(기준 55점). 표본 평균 제목 길이 약 ${Math.round(metrics.avgTitleLength)}자. 핵심 키워드가 제목 뒤에 있거나 제목이 지나치게 길면 클릭률(CTR)이 낮아지고 노출 대비 유입이 줄어듭니다.`,
      expectedEffect: "핵심 키워드가 앞 15자 안에 오면 썸네일 클릭률이 개선되고, CTR 상승은 알고리즘 추천 빈도를 직접 높입니다.",
      scenarioText:
        `평균 제목 길이 약 ${Math.round(metrics.avgTitleLength)}자로 핵심 키워드 위치에 따라 클릭률에 영향을 줄 수 있는 구조입니다.\n` +
        `핵심 키워드를 앞 15자 안에 배치하면 CTR이 먼저 반응하고, CTR 개선이 노출 확대로 이어집니다.\n` +
        `CTR 개선 → 알고리즘 노출 확대 → 동일 주제 관련 영상 추천 빈도 상승 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "최근 영상 3개의 제목에서 핵심 키워드 위치를 확인하세요.\n핵심어가 앞 15자 안에 오도록 제목을 수정해 비교안을 만드세요.\n수정 전후 CTR 변화를 다음 업로드에서 직접 측정하세요.",
    });
  }

  if (
    (sections.contentStructure < threshold || sections.seoOptimization < threshold) &&
    metrics.avgTagCount != null &&
    Number.isFinite(metrics.avgTagCount)
  ) {
    out.push({
      id: "metric-tags",
      title: "태그 정비 — 무관 태그를 줄이고 주제 적합도를 높이세요",
      whyNeeded: `표본 평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개. 태그가 많아도 주제와 맞지 않으면 잘못된 시청자에게 노출되어 발견성이 오히려 떨어집니다. 주제 적합 태그 5~10개가 무관 태그 30개보다 효과적입니다.`,
      expectedEffect: "주제에 맞는 태그를 정리하면 검색 발견성이 높아지고, 관심사가 맞는 시청자에게 노출되어 반응률이 올라갑니다.",
      scenarioText:
        `평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개로 주제 적합도가 낮은 태그가 섞인 경우 잘못된 시청자에게 노출되는 구조입니다.\n` +
        `주제 적합 태그 정리 시 검색 노출 대상이 먼저 좁혀지고, 이후 클릭 반응률이 개선됩니다.\n` +
        `노출 대상 정교화 → 클릭 반응 개선 → 관심사 매칭 시청자 유입 증가 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "low",
      executionHint:
        "최근 영상 하나의 태그 목록을 열어 주제와 무관한 태그를 골라내세요.\n주제 핵심어·관련 검색어 기준 5~10개만 남기고 나머지를 제거하세요.\n다음 업로드부터 이 기준을 그대로 적용하세요.",
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
      title: "영상 길이 최적화 — 주제에 맞는 길이를 찾으세요",
      whyNeeded: `콘텐츠·구조 구간 ${Math.round(sections.contentStructure)}점(기준 55점). 표본 평균 영상 길이 약 ${minutes}분 ${seconds.toString().padStart(2, "0")}초. 주제에 비해 지나치게 길거나 짧으면 시청 유지율이 낮아지고, 이탈 신호가 알고리즘 추천을 줄이는 방향으로 작용합니다.`,
      expectedEffect: "불필요한 구간을 제거해 시청 유지율을 높이면 알고리즘이 해당 영상을 더 긴 시간 노출하고 추천합니다.",
      scenarioText:
        `평균 영상 길이 약 ${minutes}분 ${seconds.toString().padStart(2, "0")}초로 주제 대비 구간이 늘어지면 시청 유지율이 낮아지는 구조입니다.\n` +
        `불필요한 구간 제거 시 시청 유지율이 먼저 반응하고, 이탈 신호 감소가 추천 빈도로 이어집니다.\n` +
        `시청 유지율 개선 → 이탈 신호 감소 → 알고리즘 추천 유지 → 평균 노출 시간 확대 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "medium",
      executionHint:
        "최근 영상 2개를 직접 시청하며 내용이 늘어지는 구간의 시간대를 기록하세요.\n늘어지는 구간이 30초 이상이면 다음 편집에서 해당 부분을 줄이세요.\n수정 후 시청 유지율 그래프의 변화를 YouTube 스튜디오에서 확인하세요.",
    });
  }

  if (
    sections.growthMomentum < threshold &&
    metrics.medianViewCount != null &&
    Number.isFinite(metrics.medianViewCount)
  ) {
    out.push({
      id: "metric-growth-median",
      title: "조회 분포 정상화 — 특정 영상 의존을 줄여야 합니다",
      whyNeeded: `성장 신호 구간 ${Math.round(sections.growthMomentum)}점(기준 55점). 표본 중앙 조회수 약 ${Math.round(metrics.medianViewCount)}회. 중앙값이 낮으면 채널 성과가 일부 히트 영상에 집중되는 구조로, 히트 영상이 없으면 전체 조회가 급감하는 리스크가 있습니다.`,
      expectedEffect: "반복 가능한 포맷이 정착되면 중앙 조회수가 상승하고, 히트 의존 없이도 안정적인 조회 흐름이 만들어집니다.",
      scenarioText:
        `표본 중앙 조회수 약 ${Math.round(metrics.medianViewCount)}회로 일부 히트 영상에 조회가 집중되는 구조로 볼 수 있습니다.\n` +
        `반복 가능한 포맷 실험 시 중간 성과 영상 수가 먼저 늘어나고, 전체 조회 분포가 고르게 됩니다.\n` +
        `중간 성과 영상 증가 → 조회 분포 안정화 → 히트 의존도 감소 → 채널 구조 안정화 순으로 변화가 나타날 수 있습니다.`,
      difficulty: "high",
      executionHint:
        "상위 3개 영상과 하위 3개 영상을 나란히 비교해 주제·포맷·제목 패턴 차이를 정리하세요.\n중간 성과(중앙값 근처) 영상 중 반복 가능한 포맷 하나를 선택하세요.\n다음 1편에서 그 포맷을 따라 업로드하고 결과를 이전 중앙값과 비교하세요.",
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
    evidenceSource: "channel_dna",
    sortTier: b.sortTier,
    sortOrder: b.sortOrder,
  }));
}

/**
 * 우선순위: 1 채널 DNA 히트 → 2 편차 → 3 업로드 → 4 구간(채널 DNA 구간 카드 → 수치 기반 메트릭) → 5 강점 확장 → 6 텍스트 약점·병목
 */
function mergePrioritizedActionStack(
  channelDnaRows: ChannelDnaActionCandidate[],
  metricActions: Omit<ActionPlanCardVm, "priority">[],
  textActions: Omit<ActionPlanCardVm, "priority">[]
): Omit<ActionPlanCardVm, "priority">[] {
  const bench = channelDnaRowsToSortable(channelDnaRows);
  const metricS = toSortableMetricAndText(metricActions, 4, 100);
  const textS = toSortableMetricAndText(textActions, 6, 0);
  const all: SortableActionCandidate[] = [...bench, ...metricS, ...textS];
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
  return (Object.keys(SECTION_LABELS) as (keyof ChannelSectionScores)[]).map(
    (k) => ({
      label: SECTION_LABELS[k],
      score: Math.round(sections[k]),
    })
  );
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

  const internalChannelDnaSummary = buildInternalChannelDnaSummary(data);
  const channelDnaSignals = pickChannelDnaSignalsForActionPlan(internalChannelDnaSummary);

  const textActions = buildTextBackedActions(weaknesses, bottlenecks);
  const metricActions = buildMetricBackedActions(sections, metrics);
  const channelDnaRows = buildChannelDnaActionCandidates(channelDnaSignals, sections);
  const metricActionsFiltered = filterMetricActionsSupersededByChannelDna(
    metricActions,
    channelDnaRows
  );
  let merged = mergePrioritizedActionStack(
    channelDnaRows,
    metricActionsFiltered,
    textActions
  );

  if (merged.length === 0 && sections != null) {
    const keys = (
      Object.keys(SECTION_LABELS) as (keyof ChannelSectionScores)[]
    ).filter((k) => sections[k] < 50);
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
