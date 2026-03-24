/**
 * Action Plan 화면은 `analysis_results` 베이스 스냅샷만으로 카드·체크리스트를 구성한다.
 * 확장 범위·향후 수집 필드: `@/lib/analysis/menuExtensionDataStrategy` 의 `action_plan`.
 */
import type {
  AnalysisPageData,
  AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
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
import { buildInternalBenchmarkSummary } from "@/lib/benchmark/internalBenchmarkSummary";
import { pickBenchmarkSignalsForActionPlan } from "@/lib/benchmark/benchmarkSignalsForActionPlan";
import {
  buildBenchmarkActionCandidates,
  filterMetricActionsSupersededByBenchmark,
  type BenchmarkActionCandidate,
} from "@/lib/action-plan/buildBenchmarkActionCandidates";

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
  "지표 개선을 보장하지 않으며, 소규모 실험 후 변화를 직접 확인하는 방식이 안전합니다.";

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

function parseSectionScores(raw: unknown): ChannelSectionScores | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const keys: (keyof ChannelSectionScores)[] = [
    "channelActivity",
    "audienceResponse",
    "contentStructure",
    "seoOptimization",
    "growthMomentum",
  ];
  const out: Partial<ChannelSectionScores> = {};
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = Math.max(0, Math.min(100, v));
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
    channelActivity: out.channelActivity ?? 0,
    audienceResponse: out.audienceResponse ?? 0,
    contentStructure: out.contentStructure ?? 0,
    seoOptimization: out.seoOptimization ?? 0,
    growthMomentum: out.growthMomentum ?? 0,
  };
}

function titleFromText(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) {
    return t;
  }
  return `${t.slice(0, maxLen - 1)}…`;
}

type TextSourceKind = "weakness" | "bottleneck";

/**
 * TODO(확장 수집): 경쟁 벤치마크·사용자 진행도 등은
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
      title: titleFromText(item.text, 72),
      whyNeeded: `${label}으로 저장된 내용: ${item.text}`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: item.kind === "bottleneck" ? "high" : "medium",
      executionHint:
        "해당 문구를 기준으로 원인을 한 가지씩 좁힌 뒤, 다음 1~2회 업로드에서만 작은 범위로 바꿔 보고 결과를 기록하세요.",
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
      title: "업로드·활동 점수와 최근 업로드 수 점검",
      whyNeeded: `저장된 업로드·활동 구간 점수가 ${Math.round(sections.channelActivity)}점이며, 스냅샷의 최근 30일 업로드 수는 ${metrics.recent30dUploadCount}건입니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "업로드 빈도 목표를 현실적인 수준으로 정한 뒤, 달력에만 먼저 반영하고 영상 제작 일정과 맞는지 확인하세요.",
    });
  }

  if (
    sections.channelActivity < threshold &&
    metrics.avgUploadIntervalDays != null &&
    Number.isFinite(metrics.avgUploadIntervalDays)
  ) {
    out.push({
      id: "metric-activity-interval",
      title: "평균 업로드 간격 점검",
      whyNeeded: `표본 기준 평균 업로드 간격이 약 ${metrics.avgUploadIntervalDays.toFixed(1)}일로 기록되어 있습니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "간격이 길다고 판단되면, 주기를 바꾸기 전에 한 달 단위로 현재 간격을 유지한 채 원인(기획·촬영 병목)부터 정리하세요.",
    });
  }

  if (
    sections.audienceResponse < threshold &&
    metrics.avgLikeRatio != null &&
    Number.isFinite(metrics.avgLikeRatio)
  ) {
    out.push({
      id: "metric-audience-like",
      title: "조회·반응 구간과 좋아요 비율 확인",
      whyNeeded: `조회·반응 구간 점수 ${Math.round(sections.audienceResponse)}점, 표본 평균 좋아요 비율은 약 ${(metrics.avgLikeRatio * 100).toFixed(2)}%입니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "medium",
      executionHint:
        "비율만으로 품질을 단정하지 말고, 최근 영상 몇 개의 제목·썸네일·첫 30초 구성을 /analysis 표본과 비교해 보세요.",
    });
  }

  if (
    sections.contentStructure < threshold &&
    metrics.avgTitleLength != null &&
    Number.isFinite(metrics.avgTitleLength)
  ) {
    out.push({
      id: "metric-structure-title",
      title: "제목 길이·구조 점검",
      whyNeeded: `콘텐츠·구조 점수 ${Math.round(sections.contentStructure)}점, 표본 평균 제목 길이는 약 ${Math.round(metrics.avgTitleLength)}자입니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "핵심 키워드가 앞쪽에 오는지, 과도하게 길지 않은지 위주로 몇 개 제목만 직접 편집해 실험하세요.",
    });
  }

  if (
    (sections.contentStructure < threshold || sections.seoOptimization < threshold) &&
    metrics.avgTagCount != null &&
    Number.isFinite(metrics.avgTagCount)
  ) {
    out.push({
      id: "metric-tags",
      title: "태그 수 점검(발견성 참고)",
      whyNeeded: `표본 평균 태그 수는 약 ${metrics.avgTagCount.toFixed(1)}개입니다. 메타·발견성 또는 구조 점수가 낮게 기록된 경우 참고용으로 검토하세요.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "태그를 늘리기보다, 실제 주제와 맞는 소수의 태그만 남기고 중복·무관 태그를 줄이는 방향도 함께 검토하세요.",
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
      title: "영상 길이(표본 평균) 점검",
      whyNeeded: `표본 평균 영상 길이는 약 ${minutes}분 ${seconds.toString().padStart(2, "0")}초로 기록되었습니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "medium",
      executionHint:
        "주제에 맞는 길이인지, 시청 유지에 불리한 패턴이 반복되는지 최근 2~3개 작품만 골라 직접 시청하며 점검하세요.",
    });
  }

  if (
    sections.growthMomentum < threshold &&
    metrics.medianViewCount != null &&
    Number.isFinite(metrics.medianViewCount)
  ) {
    out.push({
      id: "metric-growth-median",
      title: "성장 신호·조회 분포 참고",
      whyNeeded: `성장 신호 구간 점수 ${Math.round(sections.growthMomentum)}점, 표본 중앙 조회수는 약 ${Math.round(metrics.medianViewCount)}회입니다.`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "high",
      executionHint:
        "상위 소수 영상에 의존하는지 표본 목록을 다시 보고, 반복 가능한 주제인지 여부만 우선 정리하세요. 성장을 보장하지 않습니다.",
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

function benchmarkRowsToSortable(
  rows: BenchmarkActionCandidate[]
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
 * 우선순위: 1 벤치마크 히트 → 2 편차 → 3 업로드 → 4 구간(벤치 구간 카드 → 수치 기반 메트릭) → 5 강점 확장 → 6 텍스트 약점·병목
 */
function mergePrioritizedActionStack(
  benchmarkRows: BenchmarkActionCandidate[],
  metricActions: Omit<ActionPlanCardVm, "priority">[],
  textActions: Omit<ActionPlanCardVm, "priority">[]
): Omit<ActionPlanCardVm, "priority">[] {
  const bench = benchmarkRowsToSortable(benchmarkRows);
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
    const line = `병목·주의: ${t}`;
    if (seen.has(line) || out.length >= 5) continue;
    seen.add(line);
    out.push(line);
  }
  for (const t of uniqueTrimmedStrings(weaknesses)) {
    const line = `약점 유의: ${t}`;
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
  const snapshot = row.feature_snapshot;
  const metrics = extractMetricsFromSnapshot(snapshot);
  const flags = extractPatternFlags(snapshot);
  const sections = parseSectionScores(row.feature_section_scores);

  const totalRaw = row.feature_total_score;
  const totalScore =
    typeof totalRaw === "number" && Number.isFinite(totalRaw)
      ? Math.max(0, Math.min(100, totalRaw))
      : null;

  const weaknesses = safeStringArray(row.weaknesses);
  const bottlenecks = safeStringArray(row.bottlenecks);

  const internalBenchSummary = buildInternalBenchmarkSummary(data);
  const benchSignals = pickBenchmarkSignalsForActionPlan(internalBenchSummary);

  const textActions = buildTextBackedActions(weaknesses, bottlenecks);
  const metricActions = buildMetricBackedActions(sections, metrics);
  const benchmarkRows = buildBenchmarkActionCandidates(benchSignals, sections);
  const metricActionsFiltered = filterMetricActionsSupersededByBenchmark(
    metricActions,
    benchmarkRows
  );
  let merged = mergePrioritizedActionStack(
    benchmarkRows,
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
          whyNeeded: `다음 구간 점수가 50 미만으로 기록되었습니다: ${labels}. 세부 수치는 /analysis에서 확인할 수 있습니다.`,
          expectedEffect: CONSERVATIVE_EFFECT,
          difficulty: "medium" as const,
          executionHint:
            "/analysis의 구간 카드와 표본 지표를 함께 보고, 원인 가설을 한 가지만 정한 뒤 작은 실험을 계획하세요.",
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
    benchmarkRows.length === 0 &&
    textActions.length === 0 &&
    metricActions.length === 0 &&
    actions.length <= 1
  ) {
    const extra =
      "저장된 약점·병목 문구와 수치·벤치마크 근거가 거의 없어 제안 범위가 매우 좁습니다.";
    limitNotice = limitNotice ? `${limitNotice} ${extra}` : extra;
  }

  if (benchmarkRows.length > 0) {
    const benchLine =
      "일부 우선순위 카드는 /channel-dna와 동일한 저장 스냅샷에서 계산된 내부 신호를 근거로 합니다.";
    limitNotice = limitNotice ? `${limitNotice} ${benchLine}` : benchLine;
  }

  if (actions.length === 0) {
    const base =
      "현재 확보된 데이터 기준으로 우선순위 액션 카드를 구성할 수 없습니다. /analysis에서 분석·스냅샷을 확인하세요.";
    limitNotice = limitNotice ? `${limitNotice} ${base}` : base;
  }

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
  };
}
