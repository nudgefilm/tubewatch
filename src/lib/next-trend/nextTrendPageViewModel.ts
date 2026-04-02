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
};

const EMPTY_ITEMS: TrendItemVm[] = [];

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
