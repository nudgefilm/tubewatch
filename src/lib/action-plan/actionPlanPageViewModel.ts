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
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: item.kind === "bottleneck" ? "high" : "medium",
      executionHint:
        "이 신호를 유발하는 원인을 하나로 좁히고, 다음 1~2회 업로드에서 그 요소만 바꿔 결과를 기록하세요.",
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
      whyNeeded: `업로드·활동 구간이 ${Math.round(sections.channelActivity)}점으로 기준(55점) 이하입니다. 최근 30일 업로드 ${metrics.recent30dUploadCount}건은 알고리즘이 채널을 활성 상태로 인식하기에 부족할 수 있습니다. 지금 업로드 계획을 달력에 확정하세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "이번 달 업로드 목표 횟수를 달력에 먼저 고정하고, 촬영·편집 일정과 충돌 없이 맞는지 확인하세요.",
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
      whyNeeded: `표본 기준 평균 업로드 간격이 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일로 측정됩니다. 간격이 고르지 않으면 구독자 기대 주기가 형성되지 않아 이탈이 생깁니다. 먼저 병목 구간을 파악하세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "간격을 바꾸기 전에 기획·촬영·편집 중 어느 단계에서 병목이 생기는지 한 주 단위로 기록하세요.",
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
      whyNeeded: `조회·반응 구간이 ${Math.round(sections.audienceResponse)}점으로 낮고, 좋아요 비율은 약 ${(metrics.avgLikeRatio * 100).toFixed(2)}%입니다. 반응이 낮을수록 알고리즘의 추천 범위가 좁아집니다. 제목·썸네일·첫 30초를 점검하세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "medium",
      executionHint:
        "최근 영상 3개의 제목·썸네일·첫 30초를 비교하고, 반응이 가장 높은 영상과 낮은 영상의 차이점을 한 줄로 정리하세요.",
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
      whyNeeded: `콘텐츠·구조 구간이 ${Math.round(sections.contentStructure)}점이며, 표본 평균 제목 길이가 약 ${Math.round(metrics.avgTitleLength)}자입니다. 제목이 길거나 핵심어가 뒷부분에 몰리면 클릭률이 떨어집니다. 지금 바로 제목을 다시 써 보세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "핵심 키워드가 앞 15자 안에 들어오는지 확인하고, 최근 3개 제목을 직접 편집해 비교해 보세요.",
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
      whyNeeded: `표본 평균 태그 수가 약 ${metrics.avgTagCount.toFixed(1)}개입니다. 태그가 많아도 주제와 맞지 않으면 발견성에 도움이 되지 않습니다. 지금 태그 목록을 주제 기준으로 정리하세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "태그를 늘리기보다 실제 주제와 맞는 5~10개만 남기고 중복·무관 태그를 제거하세요.",
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
      whyNeeded: `콘텐츠·구조 구간이 ${Math.round(sections.contentStructure)}점이고, 표본 평균 영상 길이가 약 ${minutes}분 ${seconds.toString().padStart(2, "0")}초입니다. 주제에 맞지 않는 길이는 시청 이탈률을 높입니다. 어느 구간이 늘어지는지 직접 확인하세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "medium",
      executionHint:
        "최근 2~3개 영상을 직접 시청하며 어느 구간에서 내용이 늘어지거나 끊기는지 시간대를 기록하세요.",
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
      whyNeeded: `성장 신호 구간이 ${Math.round(sections.growthMomentum)}점이며, 표본 중앙 조회수는 약 ${Math.round(metrics.medianViewCount)}회입니다. 중앙값이 낮으면 일부 히트 영상에 의존하는 구조일 수 있습니다. 반복 가능한 포맷을 찾아야 합니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "high",
      executionHint:
        "상위·하위 표본을 나란히 놓고 반복 가능한 주제인지 판단한 뒤, 다음 1편에서 중간 성과 영상의 포맷을 따라 실험하세요.",
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
      description: `표본 기준 평균 업로드 간격 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일입니다. 목표 주기와 맞는지 확인하세요.`,
      difficulty: "easy",
    });
  }

  if (metrics?.recent30dUploadCount != null && Number.isFinite(metrics.recent30dUploadCount)) {
    items.push({
      id: "chk-recent-uploads",
      title: "최근 30일 업로드 수",
      description: `최근 30일 업로드 ${Math.round(metrics.recent30dUploadCount)}건이 스냅샷에 기록되어 있습니다.`,
      difficulty: "easy",
    });
  }

  if (metrics?.avgTitleLength != null && Number.isFinite(metrics.avgTitleLength)) {
    items.push({
      id: "chk-title-len",
      title: "제목 구조·길이",
      description: `평균 제목 길이 약 ${Math.round(metrics.avgTitleLength)}자입니다. 핵심 정보가 앞쪽에 있는지 몇 개만 직접 검토하세요.`,
      difficulty: "easy",
    });
  }

  if (metrics?.avgVideoDuration != null && Number.isFinite(metrics.avgVideoDuration)) {
    const m = Math.floor(metrics.avgVideoDuration / 60);
    const s = Math.round(metrics.avgVideoDuration % 60);
    items.push({
      id: "chk-duration",
      title: "영상 길이",
      description: `표본 평균 길이 약 ${m}분 ${s.toString().padStart(2, "0")}초입니다. 주제 대비 과도하게 길거나 짧지 않은지 확인하세요.`,
      difficulty: "medium",
    });
  }

  if (flags.includes("repeated_topic_pattern")) {
    items.push({
      id: "chk-format-repeat",
      title: "반복 포맷·주제 패턴",
      description:
        "스냅샷 패턴에 ‘반복 주제’ 플래그가 있습니다. 시리즈화 의도인지, 피로 요인인지 구분해 보세요.",
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
        "짧은/긴 영상 비중 플래그가 있습니다. 채널 포지션과 맞는지 최근 업로드 몇 개만 다시 살펴보세요.",
      difficulty: "medium",
    });
  }

  if (metrics?.avgTagCount != null && Number.isFinite(metrics.avgTagCount)) {
    items.push({
      id: "chk-tags",
      title: "태그·키워드 사용",
      description: `평균 태그 수 약 ${metrics.avgTagCount.toFixed(1)}개입니다. 주제와 무관한 태그가 섞였는지 확인하세요.`,
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

  const summaryParts: string[] = [
    `총 ${actions.length}개 액션이 우선순위별로 구성되어 있습니다.`,
  ];
  if (p1.length > 0) {
    summaryParts.push(
      `P1 ${p1.length}개를 먼저 실행하고, P2 ${p2.length}개를 이어서 진행하세요.`
    );
  }
  if (totalScore != null) {
    summaryParts.push(`현재 채널 종합 점수 ${Math.round(totalScore)}점 기준으로 도출된 제안입니다.`);
  }

  const takeaways = actions.slice(0, 3).map((a) => `[${a.priority}] ${a.title}`);

  return {
    headline,
    summary: summaryParts.slice(0, 2).join(" "),
    keyTakeaways: takeaways,
    priorityAction: p1[0]?.executionHint ?? null,
    caution: cautions[0] ?? null,
  };
}
