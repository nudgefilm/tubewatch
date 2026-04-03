/**
 * Next Trend: 저장된 분석 스냅샷 표본만으로 "최근 흐름 감지".
 * 외부 API·미래 추정·mock 없음.
 */
import type { AnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import {
  deriveAnalysisRunsLoaded,
  deriveExtensionMenuFields,
} from "@/lib/analysis/analysisRun";
import { pickYoutubeAccessFieldsFromPageData } from "@/lib/analysis/pickYoutubeAccessFromPageData";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";
import type { AnalysisStatus } from "@/lib/analysis/types";
import { buildTrendSignals } from "@/lib/next-trend/buildTrendSignals";
import { buildTrendInsights } from "@/lib/next-trend/buildTrendInsights";
import type { TrendItemVm as TrendItemVmBase } from "@/lib/next-trend/buildTrendInsights";
import { parseSectionScores } from "@/lib/analysis/engine/parseSectionScores";
import { normalizeFeatureSnapshot } from "@/lib/analysis/normalizeSnapshot";
import type { NormalizedSnapshotVideo } from "@/lib/analysis/normalizeSnapshot";
import type { StrategicCommentVm } from "@/lib/shared/strategicCommentTypes";
import {
  buildNextTrendExtensionBlock,
  buildNextTrendInternalBlocksSkipped,
  buildNextTrendInternalSpec,
} from "@/lib/next-trend/buildNextTrendInternalSpec";
import type {
  NextTrendExtensionVm,
  NextTrendInternalBlocks,
} from "@/lib/next-trend/buildNextTrendInternalSpec";

export type TrendItemVm = TrendItemVmBase;

/** 태그별 조회수 효율 — 전체 평균 대비 배수 */
export type TagEfficiencyVm = {
  tag: string;
  /** 전체 평균 대비 배수. e.g. 2.4 = 평소보다 2.4배 */
  multiplier: number;
  avgViews: number;
  sampleCount: number;
};

/** 요일별 참여율 상승 — 최적 업로드 요일 */
export type TemporalResonanceVm = {
  dayLabel: string;       // "금요일"
  liftPercent: number;    // 35 (overall 대비 %)
  metric: "댓글" | "좋아요";
  sampleCount: number;
};

/** 시청자 체류 시간 예측 — 조회수 상위 구간의 영상 길이 스윗스팟 */
export type WatchTimeCatalystVm = {
  /** 상위 10% 영상들의 최단 길이(초) */
  sweetSpotMinSec: number;
  /** 상위 10% 영상들의 최장 길이(초) */
  sweetSpotMaxSec: number;
  /** 상위 10% 영상들의 평균 길이(초) */
  sweetSpotAvgSec: number;
  /** 채널 전체 평균 길이(초) */
  overallAvgSec: number;
  /** 상위 10% 표본 수 */
  topSampleCount: number;
  /** 전체 유효 표본 수 */
  totalSampleCount: number;
  /** 스윗스팟 포맷 분류 */
  formatLabel: string;
};

const DATA_PIPELINE_NOTICE =
  "저장된 분석 표본 기반입니다. 외부 검색량·시즌 트렌드는 포함하지 않습니다.";

export type NextTrendPageViewModel = {
  hasChannel: boolean;
  hasAnalysisEffective: boolean;
  selectedChannelId: string | null;
  channelTitle: string | null;
  menuStatus: AnalysisStatus;
  lastRunAt: string | null;
  analysisRunsLoaded: boolean;
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
  /** 내부 표본 데이터 범위 안내(확장 전략 문구와 혼합하지 않음) */
  dataPipelineNotice: string;
  trendSummary: string;
  internal: NextTrendInternalBlocks;
  extension: NextTrendExtensionVm;
  detectedPatterns: TrendItemVm[];
  repeatedTopics: TrendItemVm[];
  formatChanges: TrendItemVm[];
  evidenceNotes: string[];
  hasEnoughTrendSignal: boolean;
  /** 페이지 하단 전략 코멘트 카드 */
  strategicComment: StrategicCommentVm | null;
  /** 성장 모멘텀 섹션 점수 (0–100), 없으면 null */
  growthMomentum: number | null;
  /** 평균 업로드 간격(일), 없으면 null */
  avgUploadIntervalDays: number | null;
  /** SEO 최적화 상태 섹션 점수 (0–100), 없으면 null */
  seoOptimization: number | null;
  /** 태그 효율성 — 전체 평균 대비 조회 배수 상위 태그 */
  tagEfficiency: TagEfficiencyVm[];
  /** 요일별 참여율 최적 시간대 */
  temporalResonance: TemporalResonanceVm | null;
  /** 조회수 상위 10% 영상의 길이 스윗스팟 */
  watchTimeCatalyst: WatchTimeCatalystVm | null;
};

const EMPTY_ITEMS: TrendItemVm[] = [];
const DAY_LABELS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function buildTagEfficiency(videos: NormalizedSnapshotVideo[]): TagEfficiencyVm[] {
  const withViews = videos.filter(
    (v) => v.viewCount != null && v.viewCount >= 0 && v.tags.length > 0
  );
  if (withViews.length < 4) return [];

  const overallAvg =
    withViews.reduce((s, v) => s + (v.viewCount ?? 0), 0) / withViews.length;
  if (overallAvg === 0) return [];

  const tagMap = new Map<string, number[]>();
  for (const v of withViews) {
    for (const raw of v.tags) {
      const tag = raw.trim();
      if (!tag) continue;
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(v.viewCount ?? 0);
    }
  }

  const results: TagEfficiencyVm[] = [];
  for (const [tag, views] of Array.from(tagMap.entries())) {
    if (views.length < 2) continue;
    const avgViews = views.reduce((s, v) => s + v, 0) / views.length;
    const multiplier = avgViews / overallAvg;
    if (multiplier < 1.2) continue;
    results.push({
      tag,
      multiplier: Math.round(multiplier * 10) / 10,
      avgViews: Math.round(avgViews),
      sampleCount: views.length,
    });
  }

  return results.sort((a, b) => b.multiplier - a.multiplier).slice(0, 5);
}

function buildTemporalResonance(
  videos: NormalizedSnapshotVideo[]
): TemporalResonanceVm | null {
  const valid = videos.filter(
    (v) =>
      v.publishedAt != null &&
      v.viewCount != null &&
      v.viewCount > 0 &&
      (v.likeCount != null || v.commentCount != null)
  );
  if (valid.length < 6) return null;

  const overallLikeRate =
    valid.reduce((s, v) => s + (v.likeCount ?? 0) / (v.viewCount ?? 1), 0) /
    valid.length;
  const overallCommentRate =
    valid.reduce(
      (s, v) => s + (v.commentCount ?? 0) / (v.viewCount ?? 1),
      0
    ) / valid.length;

  const dayGroups = new Map<number, typeof valid>();
  for (const v of valid) {
    const day = new Date(v.publishedAt!).getDay();
    if (!dayGroups.has(day)) dayGroups.set(day, []);
    dayGroups.get(day)!.push(v);
  }

  let bestDay: number | null = null;
  let bestLift = 0;
  let bestMetric: "댓글" | "좋아요" = "댓글";
  let bestCount = 0;

  for (const [day, vids] of Array.from(dayGroups.entries())) {
    if (vids.length < 2) continue;
    const avgLikeRate =
      vids.reduce((s, v) => s + (v.likeCount ?? 0) / (v.viewCount ?? 1), 0) /
      vids.length;
    const avgCommentRate =
      vids.reduce(
        (s, v) => s + (v.commentCount ?? 0) / (v.viewCount ?? 1),
        0
      ) / vids.length;

    const likeLift =
      overallLikeRate > 0
        ? (avgLikeRate - overallLikeRate) / overallLikeRate
        : 0;
    const commentLift =
      overallCommentRate > 0
        ? (avgCommentRate - overallCommentRate) / overallCommentRate
        : 0;

    const maxLift = Math.max(likeLift, commentLift);
    if (maxLift > bestLift) {
      bestLift = maxLift;
      bestDay = day;
      bestMetric = commentLift >= likeLift ? "댓글" : "좋아요";
      bestCount = vids.length;
    }
  }

  if (bestDay === null || bestLift < 0.15) return null;

  return {
    dayLabel: DAY_LABELS[bestDay] ?? "알 수 없음",
    liftPercent: Math.round(bestLift * 100),
    metric: bestMetric,
    sampleCount: bestCount,
  };
}

function formatCatalystLabel(seconds: number): string {
  if (seconds < 300) return "숏폼";
  if (seconds < 480) return "미드폼(짧은)";
  if (seconds < 1200) return "미드폼";
  return "롱폼";
}

function buildWatchTimeCatalyst(
  videos: NormalizedSnapshotVideo[]
): WatchTimeCatalystVm | null {
  // 최근 50개만 사용
  const recent = videos.slice(0, 50);

  // viewCount & durationSeconds 모두 유효한 것만
  const valid = recent.filter(
    (v) =>
      v.viewCount != null &&
      v.viewCount >= 0 &&
      v.durationSeconds != null &&
      v.durationSeconds > 0
  );
  if (valid.length < 5) return null;

  // 조회수 내림차순 정렬
  const sorted = [...valid].sort(
    (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
  );

  // 상위 10% (최소 2개)
  const topCount = Math.max(2, Math.ceil(sorted.length * 0.1));
  const topVideos = sorted.slice(0, topCount);

  const topDurations = topVideos.map((v) => v.durationSeconds!);
  const sweetSpotMinSec = Math.min(...topDurations);
  const sweetSpotMaxSec = Math.max(...topDurations);
  const sweetSpotAvgSec = Math.round(
    topDurations.reduce((s, d) => s + d, 0) / topDurations.length
  );

  const allDurations = valid.map((v) => v.durationSeconds!);
  const overallAvgSec = Math.round(
    allDurations.reduce((s, d) => s + d, 0) / allDurations.length
  );

  return {
    sweetSpotMinSec,
    sweetSpotMaxSec,
    sweetSpotAvgSec,
    overallAvgSec,
    topSampleCount: topCount,
    totalSampleCount: valid.length,
    formatLabel: formatCatalystLabel(sweetSpotAvgSec),
  };
}

export function buildNextTrendPageViewModel(
  data: AnalysisPageData | null
): NextTrendPageViewModel {
  const menu = deriveExtensionMenuFields(data, "next_trend");
  const yt = pickYoutubeAccessFieldsFromPageData(data);
  const extension = buildNextTrendExtensionBlock();

  const base = {
    menuStatus: menu.menuStatus,
    lastRunAt: menu.lastRunAt,
    analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
    coreAnalysisFeaturesEnabled: yt.coreAnalysisFeaturesEnabled,
    youtubeVerificationUi: yt.youtubeVerificationUi,
    dataPipelineNotice: DATA_PIPELINE_NOTICE,
    extension,
  };

  if (!data || data.channels.length === 0 || !data.selectedChannel) {
    const summary =
      "채널을 연결하고 분석을 완료하면 다음 영상 아이디어가 자동으로 생성됩니다.";
    return {
      ...base,
      hasChannel: false,
      hasAnalysisEffective: false,
      selectedChannelId: null,
      channelTitle: null,
      trendSummary: summary,
      internal: buildNextTrendInternalBlocksSkipped(summary, []),
      detectedPatterns: EMPTY_ITEMS,
      repeatedTopics: EMPTY_ITEMS,
      formatChanges: EMPTY_ITEMS,
      evidenceNotes: [],
      hasEnoughTrendSignal: false,
      strategicComment: null,
      growthMomentum: null,
      avgUploadIntervalDays: null,
      seoOptimization: null,
      tagEfficiency: [],
      temporalResonance: null,
      watchTimeCatalyst: null,
    };
  }

  const ch = data.selectedChannel;
  const channelTitle = ch.channel_title ?? null;

  if (!data.latestResult) {
    const summary =
      "분석을 먼저 완료하세요. /analysis에서 실행하면 다음 영상 아이디어가 바로 생성됩니다.";
    return {
      ...base,
      hasChannel: true,
      hasAnalysisEffective: false,
      selectedChannelId: ch.id,
      channelTitle,
      trendSummary: summary,
      internal: buildNextTrendInternalBlocksSkipped(summary, []),
      detectedPatterns: EMPTY_ITEMS,
      repeatedTopics: EMPTY_ITEMS,
      formatChanges: EMPTY_ITEMS,
      evidenceNotes: [],
      hasEnoughTrendSignal: false,
      strategicComment: null,
      growthMomentum: null,
      avgUploadIntervalDays: null,
      seoOptimization: null,
      tagEfficiency: [],
      temporalResonance: null,
      watchTimeCatalyst: null,
    };
  }

  const snapshot = data.latestResult.feature_snapshot;
  const signalBundle = buildTrendSignals(snapshot);
  const insights = buildTrendInsights(signalBundle);
  const internal = buildNextTrendInternalSpec(
    insights,
    signalBundle,
    snapshot,
    data.latestResult
  );

  const strategicComment = buildNextTrendStrategicComment(
    insights.trendSummary,
    internal
  );

  const sectionScores = parseSectionScores(data.latestResult.feature_section_scores ?? data.latestResult.section_scores);
  const normalizedSnap = normalizeFeatureSnapshot(snapshot);
  const metrics = normalizedSnap.metrics as Record<string, unknown> | null;

  return {
    ...base,
    hasChannel: true,
    hasAnalysisEffective: true,
    selectedChannelId: ch.id,
    channelTitle,
    trendSummary: insights.trendSummary,
    internal,
    detectedPatterns: insights.detectedPatterns,
    repeatedTopics: insights.repeatedTopics,
    formatChanges: insights.formatChanges,
    evidenceNotes: insights.evidenceNotes,
    hasEnoughTrendSignal: insights.hasEnoughTrendSignal,
    strategicComment,
    growthMomentum: sectionScores?.growthMomentum ?? null,
    avgUploadIntervalDays:
      typeof metrics?.avgUploadIntervalDays === "number" ? metrics.avgUploadIntervalDays : null,
    seoOptimization: sectionScores?.seoOptimization ?? null,
    tagEfficiency: buildTagEfficiency(normalizedSnap.videos),
    temporalResonance: buildTemporalResonance(normalizedSnap.videos),
    watchTimeCatalyst: buildWatchTimeCatalyst(normalizedSnap.videos),
  };
}

function buildNextTrendStrategicComment(
  trendSummary: string,
  internal: NextTrendInternalBlocks
): StrategicCommentVm | null {
  const topCandidate = internal.candidates[0];
  if (!topCandidate && trendSummary.length < 10) return null;

  const headline = topCandidate
    ? `다음 시도 방향: ${topCandidate.topic}`
    : "표본 신호 기반 방향 요약";

  const summaryParts: string[] = [trendSummary];
  const fmt = internal.format.recommendedFormat;
  if (fmt && fmt !== "-") {
    summaryParts.push(`권장 포맷: ${fmt} — ${internal.format.seriesPotential}`);
  }

  const takeaways: string[] = [];
  if (internal.candidates.length > 0)
    takeaways.push(`1순위 주제: ${internal.candidates[0].topic}`);
  if (internal.candidates.length > 1)
    takeaways.push(`2순위 주제: ${internal.candidates[1].topic}`);
  if (fmt && fmt !== "-") takeaways.push(`권장 포맷: ${fmt}`);

  const risk = internal.risk;
  const riskCaution =
    risk.riskyTopic && risk.riskyTopic !== "-" && risk.riskyTopic !== ""
      ? `주의할 주제: ${risk.riskyTopic} — ${risk.confidenceBasis}`
      : null;

  const titleHint = internal.hints.titleDirection;

  return {
    headline,
    summary: summaryParts[0],
    keyTakeaways: takeaways.slice(0, 3),
    priorityAction:
      titleHint && titleHint !== "-" ? `지금 제목에 적용: ${titleHint}` : null,
    caution: riskCaution,
  };
}
