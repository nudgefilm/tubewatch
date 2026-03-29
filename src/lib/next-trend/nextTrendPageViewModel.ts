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
  "이 페이지는 저장된 분석 스냅샷(feature_snapshot) 표본만 사용합니다. 외부 트렌드·시즌·검색 API 데이터는 포함하지 않으며, 아래 ‘확장 기능’ 블록만 외부 연동 전용입니다.";

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
      "채널이 연결되지 않아 표본 흐름을 계산하지 않았습니다. 채널 연결 후 분석을 완료하면 이 페이지에 반영됩니다.";
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
    };
  }

  const ch = data.selectedChannel;
  const channelTitle = ch.channel_title ?? null;

  if (!data.latestResult) {
    const summary =
      "저장된 분석 결과가 없어 표본 흐름을 만들 수 없습니다. /analysis에서 분석을 완료한 뒤 다시 열어 주세요.";
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
    : "다음 트렌드 방향 분석";

  const summaryParts: string[] = [trendSummary];
  const fmt = internal.format.recommendedFormat;
  if (fmt && fmt !== "-") {
    summaryParts.push(`권장 포맷은 "${fmt}"이며, ${internal.format.seriesPotential}`);
  }

  const takeaways: string[] = [];
  if (internal.candidates.length > 0)
    takeaways.push(`주력 방향: ${internal.candidates[0].topic}`);
  if (internal.candidates.length > 1)
    takeaways.push(`대안 방향: ${internal.candidates[1].topic}`);
  if (fmt && fmt !== "-") takeaways.push(`추천 포맷: ${fmt}`);

  const risk = internal.risk;
  const riskCaution =
    risk.riskyTopic && risk.riskyTopic !== "-" && risk.riskyTopic !== ""
      ? `리스크 주의: ${risk.riskyTopic} — ${risk.confidenceBasis}`
      : null;

  const titleHint = internal.hints.titleDirection;

  return {
    headline,
    summary: summaryParts[0],
    keyTakeaways: takeaways.slice(0, 3),
    priorityAction:
      titleHint && titleHint !== "-" ? `제목 방향: ${titleHint}` : null,
    caution: riskCaution,
  };
}
