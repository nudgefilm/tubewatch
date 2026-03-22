/**
 * Next Trend: 저장된 분석 스냅샷 표본만으로 "최근 흐름 감지".
 * 외부 API·미래 추정·mock 없음.
 */
import type { AnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import {
  deriveAnalysisRunsLoaded,
  deriveExtensionMenuFields,
} from "@/lib/analysis/analysisRun";
import { getMenuExtensionStrategy } from "@/lib/analysis/menuExtensionDataStrategy";
import { pickYoutubeAccessFieldsFromPageData } from "@/lib/analysis/pickYoutubeAccessFromPageData";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";
import type { AnalysisStatus } from "@/lib/analysis/types";
import { buildTrendSignals } from "@/lib/next-trend/buildTrendSignals";
import { buildTrendInsights } from "@/lib/next-trend/buildTrendInsights";
import type { TrendItemVm as TrendItemVmBase } from "@/lib/next-trend/buildTrendInsights";

export type TrendItemVm = TrendItemVmBase;

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
  /** 확장 파이프라인 안내(베이스와 별도) */
  scopeNotice: string;
  trendSummary: string;
  detectedPatterns: TrendItemVm[];
  repeatedTopics: TrendItemVm[];
  formatChanges: TrendItemVm[];
  evidenceNotes: string[];
  hasEnoughTrendSignal: boolean;
};

const EMPTY_ITEMS: TrendItemVm[] = [];

export function buildNextTrendPageViewModel(
  data: AnalysisPageData | null
): NextTrendPageViewModel {
  const menu = deriveExtensionMenuFields(data, "next_trend");
  const strategy = getMenuExtensionStrategy("next_trend");
  const yt = pickYoutubeAccessFieldsFromPageData(data);
  const scopeNotice = `${strategy.summary} ${strategy.runSemantics} 현재 화면의 흐름 요약은 베이스 스냅샷만으로 채웁니다.`;

  const base = {
    menuStatus: menu.menuStatus,
    lastRunAt: menu.lastRunAt,
    analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
    coreAnalysisFeaturesEnabled: yt.coreAnalysisFeaturesEnabled,
    youtubeVerificationUi: yt.youtubeVerificationUi,
    scopeNotice,
  };

  if (!data || data.channels.length === 0 || !data.selectedChannel) {
    return {
      ...base,
      hasChannel: false,
      hasAnalysisEffective: false,
      selectedChannelId: null,
      channelTitle: null,
      trendSummary:
        "채널이 연결되지 않아 표본 흐름을 계산하지 않았습니다. 채널 연결 후 분석을 완료하면 이 페이지에 반영됩니다.",
      detectedPatterns: EMPTY_ITEMS,
      repeatedTopics: EMPTY_ITEMS,
      formatChanges: EMPTY_ITEMS,
      evidenceNotes: [],
      hasEnoughTrendSignal: false,
    };
  }

  const ch = data.selectedChannel;
  const channelTitle = ch.channel_title ?? null;

  if (!data.latestResult) {
    return {
      ...base,
      hasChannel: true,
      hasAnalysisEffective: false,
      selectedChannelId: ch.id,
      channelTitle,
      trendSummary:
        "저장된 분석 결과가 없어 표본 흐름을 만들 수 없습니다. /analysis에서 분석을 완료한 뒤 다시 열어 주세요.",
      detectedPatterns: EMPTY_ITEMS,
      repeatedTopics: EMPTY_ITEMS,
      formatChanges: EMPTY_ITEMS,
      evidenceNotes: [],
      hasEnoughTrendSignal: false,
    };
  }

  const snapshot = data.latestResult.feature_snapshot;
  const signalBundle = buildTrendSignals(snapshot);
  const insights = buildTrendInsights(signalBundle);

  return {
    ...base,
    hasChannel: true,
    hasAnalysisEffective: true,
    selectedChannelId: ch.id,
    channelTitle,
    trendSummary: insights.trendSummary,
    detectedPatterns: insights.detectedPatterns,
    repeatedTopics: insights.repeatedTopics,
    formatChanges: insights.formatChanges,
    evidenceNotes: insights.evidenceNotes,
    hasEnoughTrendSignal: insights.hasEnoughTrendSignal,
  };
}
