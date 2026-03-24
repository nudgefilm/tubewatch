import type {
  AnalysisPageData,
  AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";
import type { AnalysisHistoryItem } from "@/components/analysis/AnalysisHistoryList";
import type { AnalysisViewModel } from "@/lib/analysis/analysisViewModel";
import { buildAnalysisViewModel } from "@/lib/analysis/analysisViewModel";
import {
  buildAnalysisReportAiFields,
  buildAnalysisReportCompareVm,
  buildAnalysisReportPresentation,
  type AnalysisReportAiFieldsVm,
  type AnalysisReportCompareVm,
  type AnalysisReportPresentationVm,
} from "@/lib/analysis/analysisReportFields";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import { enrichRowScores, mapRowToHistoryItem } from "@/lib/server/analysis/mapAnalysisHistoryAndCompare";
import type { MarketExtensionSliceVm } from "@/lib/data/marketExtensionSlice";
import { buildDefaultMarketExtensionSlice } from "@/lib/data/marketExtensionSlice";
import {
  deriveAnalysisRunsLoaded,
  deriveBaseAnalysisMenuFields,
} from "@/lib/analysis/analysisRun";
import { pickYoutubeAccessFieldsFromPageData } from "@/lib/analysis/pickYoutubeAccessFromPageData";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";
import type { AnalysisStatus } from "@/lib/analysis/types";

export type {
  AnalysisReportAiFieldsVm,
  AnalysisReportCompareVm,
  AnalysisReportPresentationVm,
} from "@/lib/analysis/analysisReportFields";

/** 클라이언트로 전달 가능한 /analysis v1 뷰 모델 */
export type AnalysisVideoRow = {
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  viewCount: number | null;
  durationLabel: string | null;
  relativeBadge: string | null;
};

export type AnalysisDiagnosisCardVm = {
  title: string;
  score: number;
  status: "good" | "warning" | "critical";
  items: { label: string; value: string; trend?: "up" | "down" }[];
};

/** 헤더 카드 평균 조회: 표본 우선, 없으면 채널 누적 환산 */
export type AnalysisChannelAvgViewsVm = {
  value: number | null;
  basis: "recent_sample" | "channel_total_per_video" | null;
  /** basis가 recent_sample일 때, 조회수가 있었던 표본 영상 수 */
  sampleVideoCount: number | null;
  /** 표본이 매우 적을 때 UI에서 보수적 안내 */
  lowSampleWarning: boolean;
};

export type AnalysisPageViewModel = {
  /** 다른 앱 페이지로 전달할 때 사용할 수 있는 현재 선택 채널(user_channels.id) */
  selectedChannelId: string | null;
  limitNotice: string | null;
  hasChannel: boolean;
  hasAnalysisResult: boolean;
  channel: {
    title: string | null;
    thumbnailUrl: string | null;
    subscriberCount: number | null;
    videoCount: number | null;
    channelViewCount: number | null;
    avgViews: AnalysisChannelAvgViewsVm;
  } | null;
  headlineDiagnosis: string | null;
  scoreGauge: { score: number; grade: string } | null;
  diagnosisCards: AnalysisDiagnosisCardVm[];
  patternSummaryLine: string | null;
  strengths: string[];
  urgentImprovements: string[];
  sampleSizeNote: string | null;
  analysisConfidence: string | null;
  recentVideos: AnalysisVideoRow[];
  topVideos: AnalysisVideoRow[];
  weakVideos: AnalysisVideoRow[];
  performanceCompareSummary: string | null;
  growthScenarioLine: string | null;
  showGrowthChartPlaceholder: boolean;
  menuStatus: AnalysisStatus;
  lastRunAt: string | null;
  /** `analysisRuns` 목록이 서버에서 확정됐는지 (`null`이면 미로드) */
  analysisRunsLoaded: boolean;
  /** YouTube 관리 채널 검증 통과 시에만 분석 실행·메뉴 run 등 핵심 동작 허용 */
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
  /** 리포트 UI 전용 — `buildAnalysisViewModel` 결과 */
  analysisViewModel: AnalysisViewModel | null;
  /** 성장 추이·이력 — `analysis_results` 최근 행 매핑 */
  analysisHistory: AnalysisHistoryItem[];
  /** Channel DNA 레이더 등 — 스냅샷 메트릭 정규화본(표시는 analysisViewModel 우선) */
  snapshotMetricsForRadar: ChannelMetrics | null;
  /** 리포트 상단·메타·점수·상태 — enrich 반영 스칼라 */
  reportPresentation: AnalysisReportPresentationVm | null;
  /** 비교 카드 — `mapRowToCompareAnalysis` 결과 */
  reportCompare: AnalysisReportCompareVm | null;
  /** Gemini 텍스트·리스트 — DB 필드 스냅샷 */
  aiInsightFields: AnalysisReportAiFieldsVm | null;
} & MarketExtensionSliceVm;

const SECTION_ORDER: {
  key: keyof ChannelSectionScores;
  title: string;
}[] = [
  { key: "channelActivity", title: "업로드·활동" },
  { key: "audienceResponse", title: "조회·반응" },
  { key: "contentStructure", title: "콘텐츠·구조" },
  { key: "seoOptimization", title: "메타·발견성" },
  { key: "growthMomentum", title: "성장 신호" },
];

type ChannelSectionScores = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
};

type MetricsPartial = Partial<Record<keyof ChannelMetrics, number>>;

function extractMetricsFromSnapshot(
  snapshot: unknown
): MetricsPartial | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }
  const raw = (snapshot as Record<string, unknown>).metrics;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as MetricsPartial;
}

function metricsPartialToChannelMetrics(m: MetricsPartial): ChannelMetrics {
  return {
    avgViewCount: typeof m.avgViewCount === "number" ? m.avgViewCount : 0,
    medianViewCount: typeof m.medianViewCount === "number" ? m.medianViewCount : 0,
    avgLikeRatio: typeof m.avgLikeRatio === "number" ? m.avgLikeRatio : 0,
    avgCommentRatio: typeof m.avgCommentRatio === "number" ? m.avgCommentRatio : 0,
    avgVideoDuration:
      typeof m.avgVideoDuration === "number" ? m.avgVideoDuration : 0,
    avgUploadIntervalDays:
      typeof m.avgUploadIntervalDays === "number" ? m.avgUploadIntervalDays : 0,
    recent30dUploadCount:
      typeof m.recent30dUploadCount === "number" ? m.recent30dUploadCount : 0,
    avgTitleLength: typeof m.avgTitleLength === "number" ? m.avgTitleLength : 0,
    avgTagCount: typeof m.avgTagCount === "number" ? m.avgTagCount : 0,
  };
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

function scoreToGrade(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function subScoreToStatus(
  score: number
): "good" | "warning" | "critical" {
  if (score >= 65) return "good";
  if (score >= 45) return "warning";
  return "critical";
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

function formatPercentRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

function formatDurationSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return "—";
  }
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function buildCardItemsForSection(
  sectionKey: keyof ChannelSectionScores,
  metrics: MetricsPartial | null
): { label: string; value: string; trend?: "up" | "down" }[] {
  const items: { label: string; value: string; trend?: "up" | "down" }[] =
    [];
  if (!metrics) {
    return items;
  }

  if (sectionKey === "channelActivity") {
    if (metrics.recent30dUploadCount != null) {
      items.push({
        label: "최근 30일 업로드",
        value: `${formatInt(metrics.recent30dUploadCount)}개`,
      });
    }
    if (metrics.avgUploadIntervalDays != null) {
      items.push({
        label: "평균 업로드 간격",
        value: `${metrics.avgUploadIntervalDays.toFixed(1)}일`,
      });
    }
  }

  if (sectionKey === "audienceResponse") {
    if (metrics.avgViewCount != null) {
      items.push({
        label: "평균 조회수(표본)",
        value: formatInt(metrics.avgViewCount),
      });
    }
    if (metrics.medianViewCount != null) {
      items.push({
        label: "중앙 조회수(표본)",
        value: formatInt(metrics.medianViewCount),
      });
    }
    if (metrics.avgLikeRatio != null) {
      items.push({
        label: "평균 좋아요 비율",
        value: formatPercentRatio(metrics.avgLikeRatio),
      });
    }
    if (metrics.avgCommentRatio != null) {
      items.push({
        label: "평균 댓글 비율",
        value: formatPercentRatio(metrics.avgCommentRatio),
      });
    }
  }

  if (sectionKey === "contentStructure") {
    if (metrics.avgTitleLength != null) {
      items.push({
        label: "평균 제목 길이",
        value: `${formatInt(metrics.avgTitleLength)}자`,
      });
    }
    if (metrics.avgTagCount != null) {
      items.push({
        label: "평균 태그 수",
        value: `${formatInt(metrics.avgTagCount)}개`,
      });
    }
    if (metrics.avgVideoDuration != null) {
      items.push({
        label: "평균 영상 길이",
        value: formatDurationSeconds(metrics.avgVideoDuration),
      });
    }
  }

  if (sectionKey === "seoOptimization") {
    if (metrics.avgTitleLength != null) {
      items.push({
        label: "제목 길이(발견성 참고)",
        value: `${formatInt(metrics.avgTitleLength)}자`,
      });
    }
    if (metrics.avgTagCount != null) {
      items.push({
        label: "태그 수(발견성 참고)",
        value: `${formatInt(metrics.avgTagCount)}개`,
      });
    }
  }

  if (sectionKey === "growthMomentum") {
    items.push({
      label: "해석",
      value:
        "최근 대비 조회 모멘텀 등은 엔진 점수로 요약됩니다. 확정적 성장 예측은 하지 않습니다.",
    });
  }

  return items;
}

/** 스냅샷 영상 배열 순서를 유지한 채, 조회수가 있는 항목만으로 산술 평균 */
function summarizeSampleAvgViews(
  videos: AnalysisVideoRow[]
): { average: number; count: number } | null {
  let sum = 0;
  let count = 0;
  for (const v of videos) {
    if (v.viewCount == null || !Number.isFinite(v.viewCount)) {
      continue;
    }
    if (v.viewCount < 0) {
      continue;
    }
    sum += v.viewCount;
    count += 1;
  }
  if (count === 0) {
    return null;
  }
  return { average: sum / count, count };
}

function buildAvgViewsVm(
  sample: { average: number; count: number } | null,
  channelViewCount: number | null,
  videoCount: number | null
): AnalysisChannelAvgViewsVm {
  if (sample != null) {
    return {
      value: sample.average,
      basis: "recent_sample",
      sampleVideoCount: sample.count,
      lowSampleWarning: sample.count < 3,
    };
  }
  if (
    channelViewCount != null &&
    videoCount != null &&
    videoCount > 0 &&
    Number.isFinite(channelViewCount)
  ) {
    return {
      value: channelViewCount / videoCount,
      basis: "channel_total_per_video",
      sampleVideoCount: null,
      lowSampleWarning: false,
    };
  }
  return {
    value: null,
    basis: null,
    sampleVideoCount: null,
    lowSampleWarning: false,
  };
}

function parseVideosFromSnapshot(snapshot: unknown): AnalysisVideoRow[] {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }
  const obj = snapshot as Record<string, unknown>;
  const raw = obj.videos ?? obj.sample_videos;
  if (!Array.isArray(raw)) {
    return [];
  }

  const rows: AnalysisVideoRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const r = item as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title : null;
    if (!title) {
      continue;
    }
    const thumbnailUrl =
      typeof r.thumbnail === "string"
        ? r.thumbnail
        : typeof r.thumbnailUrl === "string"
          ? r.thumbnailUrl
          : null;
    const publishedAt =
      typeof r.publishedAt === "string"
        ? r.publishedAt
        : typeof r.published_at === "string"
          ? r.published_at
          : null;
    const viewCount =
      typeof r.viewCount === "number"
        ? r.viewCount
        : typeof r.view_count === "number"
          ? r.view_count
          : null;

    let durationLabel: string | null = null;
    if (typeof r.durationSeconds === "number") {
      durationLabel = formatDurationSeconds(r.durationSeconds);
    } else if (typeof r.duration === "string" && r.duration.trim() !== "") {
      durationLabel = r.duration;
    }

    rows.push({
      title,
      thumbnailUrl,
      publishedAt,
      viewCount,
      durationLabel,
      relativeBadge: null,
    });
  }

  return rows;
}

function assignRelativeBadges(videos: AnalysisVideoRow[]): AnalysisVideoRow[] {
  const withViews = videos.filter(
    (v) => v.viewCount != null && Number.isFinite(v.viewCount)
  );
  if (withViews.length < 3) {
    return videos;
  }
  const sorted = [...withViews].sort(
    (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
  );
  const n = sorted.length;
  const topCut = Math.max(1, Math.ceil(n * 0.33));
  const bottomCut = Math.max(1, Math.ceil(n * 0.33));
  const topIds = new Set(sorted.slice(0, topCut).map((v) => v.title));
  const bottomIds = new Set(sorted.slice(n - bottomCut).map((v) => v.title));

  return videos.map((v) => {
    if (v.viewCount == null || !Number.isFinite(v.viewCount)) {
      return v;
    }
    if (topIds.has(v.title)) {
      return {
        ...v,
        relativeBadge: "표본 내 상대적으로 높은 조회",
      };
    }
    if (bottomIds.has(v.title)) {
      return {
        ...v,
        relativeBadge: "표본 내 상대적으로 낮은 조회",
      };
    }
    return { ...v, relativeBadge: null };
  });
}

function buildPerformanceSplit(videos: AnalysisVideoRow[]): {
  top: AnalysisVideoRow[];
  weak: AnalysisVideoRow[];
  summary: string | null;
} {
  const scored = videos.filter(
    (v) => v.viewCount != null && Number.isFinite(v.viewCount)
  );
  if (scored.length < 4) {
    return { top: [], weak: [], summary: null };
  }
  const sorted = [...scored].sort(
    (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
  );
  const k = Math.min(2, Math.floor(sorted.length / 2));
  const top = sorted.slice(0, k);
  const weak = sorted.slice(-k).reverse();
  const summary = `최근 표본 ${scored.length}개 영상 기준, 조회수 상위와 하위를 나누어 요약했습니다. 채널 전체 성과를 보장하는 지표는 아닙니다.`;
  return { top, weak, summary };
}

function buildUrgentPoints(weaknesses: string[], bottlenecks: string[]): string[] {
  const out: string[] = [];
  for (const w of weaknesses) {
    if (out.length >= 3) break;
    out.push(w);
  }
  for (const b of bottlenecks) {
    if (out.length >= 3) break;
    if (!out.includes(b)) {
      out.push(b);
    }
  }
  return out;
}

function growthScenarioLine(
  growthScore: number | null,
  flags: string[]
): string | null {
  if (growthScore == null) {
    return null;
  }
  const parts: string[] = [];
  parts.push(
    `성장 신호 점수는 저장된 엔진 기준 약 ${Math.round(growthScore)}점입니다.`
  );
  if (growthScore < 50) {
    parts.push(
      "동일 데이터만으로는 반등 시나리오를 단정하지 않으며, 업로드·반응 지표를 함께 보는 것이 안전합니다."
    );
  } else {
    parts.push(
      "표본 채널에서 관측된 지표 조합 기준으로, 완만한 개선 여지가 있을 수 있는 구간으로 해석할 수 있습니다."
    );
  }
  if (flags.length > 0) {
    parts.push(`탐지된 패턴 플래그: ${flags.slice(0, 4).join(", ")}`);
  }
  return parts.join(" ");
}

export function buildAnalysisPageViewModel(
  data: AnalysisPageData | null
): AnalysisPageViewModel {
  const ext = buildDefaultMarketExtensionSlice();
  const empty: AnalysisPageViewModel = {
    ...ext,
    ...deriveBaseAnalysisMenuFields(null),
    analysisRunsLoaded: deriveAnalysisRunsLoaded(null),
    ...pickYoutubeAccessFieldsFromPageData(null),
    selectedChannelId: null,
    limitNotice: null,
    hasChannel: false,
    hasAnalysisResult: false,
    channel: null,
    headlineDiagnosis: null,
    scoreGauge: null,
    diagnosisCards: [],
    patternSummaryLine: null,
    strengths: [],
    urgentImprovements: [],
    sampleSizeNote: null,
    analysisConfidence: null,
    recentVideos: [],
    topVideos: [],
    weakVideos: [],
    performanceCompareSummary: null,
    growthScenarioLine: null,
    showGrowthChartPlaceholder: true,
    analysisViewModel: null,
    analysisHistory: [],
    snapshotMetricsForRadar: null,
    reportPresentation: null,
    reportCompare: null,
    aiInsightFields: null,
  };

  if (!data || data.channels.length === 0 || !data.selectedChannel) {
    return {
      ...empty,
      ...deriveBaseAnalysisMenuFields(data),
      analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
      ...pickYoutubeAccessFieldsFromPageData(data),
      hasChannel: false,
      limitNotice:
        "연결된 채널이 없습니다. 설정에서 채널을 연결하면 분석 데이터가 표시됩니다.",
      analysisViewModel: null,
      analysisHistory: [],
      snapshotMetricsForRadar: null,
      reportPresentation: null,
      reportCompare: null,
      aiInsightFields: null,
    };
  }

  const ch = data.selectedChannel;
  const subs =
    typeof ch.subscriber_count === "number" ? ch.subscriber_count : null;
  const vcount = typeof ch.video_count === "number" ? ch.video_count : null;
  const chViews = typeof ch.view_count === "number" ? ch.view_count : null;

  const channelVmNoAnalysis = {
    title: ch.channel_title ?? null,
    thumbnailUrl: ch.thumbnail_url ?? null,
    subscriberCount: subs,
    videoCount: vcount,
    channelViewCount: chViews,
    avgViews: buildAvgViewsVm(null, chViews, vcount),
  };

  if (!data.latestResult) {
    const analysisHistoryNoLatest = (data.recentAnalysisResults ?? []).map(
      (r) => mapRowToHistoryItem(enrichRowScores(r))
    );
    return {
      ...empty,
      ...deriveBaseAnalysisMenuFields(data),
      analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
      ...pickYoutubeAccessFieldsFromPageData(data),
      selectedChannelId: ch.id,
      hasChannel: true,
      hasAnalysisResult: false,
      channel: channelVmNoAnalysis,
      headlineDiagnosis:
        "아직 이 채널에 대한 분석 결과가 저장되어 있지 않습니다. 분석이 완료되면 요약과 점수가 표시됩니다.",
      limitNotice:
        "현재 확보된 데이터 기준으로 요약만 제공합니다. 분석 실행 후 전체 블록이 채워집니다.",
      showGrowthChartPlaceholder: true,
      analysisViewModel: null,
      analysisHistory: analysisHistoryNoLatest,
      snapshotMetricsForRadar: null,
      reportPresentation: null,
      reportCompare: null,
      aiInsightFields: null,
    };
  }

  const row = enrichRowScores(data.latestResult);
  const snapshot = row.feature_snapshot;

  let rawVideos = parseVideosFromSnapshot(snapshot);
  const sampleAvgForHeader = summarizeSampleAvgViews(rawVideos);
  const channelVm = {
    title: ch.channel_title ?? null,
    thumbnailUrl: ch.thumbnail_url ?? null,
    subscriberCount: subs,
    videoCount: vcount,
    channelViewCount: chViews,
    avgViews: buildAvgViewsVm(sampleAvgForHeader, chViews, vcount),
  };

  const metrics = extractMetricsFromSnapshot(snapshot);
  const snapshotMetricsForRadar = metrics
    ? metricsPartialToChannelMetrics(metrics)
    : null;
  const flags = extractPatternFlags(snapshot);
  const sections = parseSectionScores(row.feature_section_scores);

  const total =
    typeof row.feature_total_score === "number" &&
    Number.isFinite(row.feature_total_score)
      ? Math.max(0, Math.min(100, row.feature_total_score))
      : null;

  const channelSummary =
    typeof row.channel_summary === "string" ? row.channel_summary : null;
  const contentPatternSummary =
    typeof row.content_pattern_summary === "string"
      ? row.content_pattern_summary
      : null;

  const headline =
    channelSummary && channelSummary.trim() !== ""
      ? channelSummary
      : contentPatternSummary && contentPatternSummary.trim() !== ""
        ? contentPatternSummary
        : null;

  const patternSummary = contentPatternSummary;

  const strengths = safeStringArray(row.strengths).slice(0, 3);
  const weaknesses = safeStringArray(row.weaknesses);
  const bottlenecks = safeStringArray(row.bottlenecks);
  const urgent = buildUrgentPoints(weaknesses, bottlenecks);

  const diagnosisCards: AnalysisDiagnosisCardVm[] = [];
  if (sections) {
    for (const { key, title } of SECTION_ORDER) {
      const score = sections[key];
      const items = buildCardItemsForSection(key, metrics);
      if (items.length === 0 && key !== "growthMomentum") {
        items.push({
          label: "표시 가능한 세부 지표",
          value: "이 구간에 매핑된 수치가 스냅샷에 없습니다.",
        });
      }
      diagnosisCards.push({
        title,
        score: Math.round(score),
        status: subScoreToStatus(score),
        items,
      });
    }
  }

  rawVideos = assignRelativeBadges(rawVideos);
  const { top, weak, summary } = buildPerformanceSplit(rawVideos);

  const growthScore = sections?.growthMomentum ?? null;
  const growthLine = growthScenarioLine(growthScore, flags);

  if (diagnosisCards.length === 0 && metrics) {
    const flatItems = buildCardItemsForSection("audienceResponse", metrics).concat(
      buildCardItemsForSection("channelActivity", metrics),
      buildCardItemsForSection("contentStructure", metrics)
    );
    const dedup: { label: string; value: string }[] = [];
    const seen = new Set<string>();
    for (const it of flatItems) {
      if (seen.has(it.label)) continue;
      seen.add(it.label);
      dedup.push(it);
    }
    diagnosisCards.push({
      title: "최근 표본 기준 요약",
      score: total != null ? Math.round(total) : 0,
      status: subScoreToStatus(total ?? 0),
      items:
        dedup.length > 0
          ? dedup.slice(0, 8)
          : [{ label: "표시", value: "세부 수치가 스냅샷에 없습니다." }],
    });
  }

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
      "일부 수치 스냅샷(feature_snapshot.metrics)이 없어 세부 행은 제한적으로 표시됩니다.";
  } else if (analysisConfidence === "low") {
    limitNotice =
      "분석 신뢰도가 낮게 기록되었습니다. 결론은 참고용으로만 활용하세요.";
  }

  const analysisViewModel = buildAnalysisViewModel(row);
  const recent = data.recentAnalysisResults ?? [];
  const analysisHistory = recent.map((r) =>
    mapRowToHistoryItem(enrichRowScores(r))
  );
  const previousRow: AnalysisResultRow | null =
    recent.length >= 2 ? recent[1] : null;
  const reportPresentation = buildAnalysisReportPresentation(
    row,
    analysisViewModel.sampleVideoCount
  );
  const aiInsightFields = buildAnalysisReportAiFields(row);
  const reportCompare = buildAnalysisReportCompareVm(row, previousRow);

  return {
    ...ext,
    ...deriveBaseAnalysisMenuFields(data),
    analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
    ...pickYoutubeAccessFieldsFromPageData(data),
    selectedChannelId: ch.id,
    limitNotice,
    hasChannel: true,
    hasAnalysisResult: true,
    channel: channelVm,
    headlineDiagnosis: headline,
    scoreGauge:
      total != null ? { score: Math.round(total), grade: scoreToGrade(total) } : null,
    diagnosisCards,
    patternSummaryLine: patternSummary,
    strengths,
    urgentImprovements: urgent,
    sampleSizeNote: sampleNote,
    analysisConfidence,
    recentVideos: rawVideos.slice(0, 12),
    topVideos: top,
    weakVideos: weak,
    performanceCompareSummary: summary,
    growthScenarioLine: growthLine,
    showGrowthChartPlaceholder: true,
    analysisViewModel,
    analysisHistory,
    snapshotMetricsForRadar,
    reportPresentation,
    reportCompare,
    aiInsightFields,
  };
}
