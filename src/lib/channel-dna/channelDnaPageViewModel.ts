import type { AnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import { getMenuExtensionStrategy } from "@/lib/analysis/menuExtensionDataStrategy";
import {
  deriveAnalysisRunsLoaded,
  deriveExtensionMenuFields,
} from "@/lib/analysis/analysisRun";
import { pickYoutubeAccessFieldsFromPageData } from "@/lib/analysis/pickYoutubeAccessFromPageData";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";
import type { AnalysisStatus } from "@/lib/analysis/types";
import {
  DEFAULT_MARKET_DATA_AVAILABILITY,
  type ChannelDnaExternalChannelVm,
  type ComparativeMetricsVm,
  type MarketDataAvailabilityVm,
  type PatternInsightsDatasetVm,
  type TrendSignalsVm,
} from "@/lib/data/marketExtensionTypes";
import {
  buildInternalChannelDnaSummary,
  type InternalChannelDnaSummaryVm,
} from "@/lib/channel-dna/internalChannelDnaSummary";

/**
 * /channel-dna 확장용 뷰모델.
 * 외부 경쟁 채널·시장 평균 미연동 시 externalChannels 는 빈 배열 유지.
 */
export type ChannelDnaPageViewModel = {
  hasChannel: boolean;
  selectedChannelId: string | null;
  menuStatus: AnalysisStatus;
  lastRunAt: string | null;
  analysisRunsLoaded: boolean;
  /** YouTube 관리 채널 검증 통과 시에만 메뉴별 실행 등 허용 */
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
  marketDataAvailability: MarketDataAvailabilityVm;
  /** 향후 경쟁 채널 엔티티 — 현재 항상 [] */
  externalChannels: ChannelDnaExternalChannelVm[];
  comparativeMetrics: ComparativeMetricsVm;
  patternInsights: PatternInsightsDatasetVm;
  trendSignals: TrendSignalsVm;
  extensionNotice: string | null;
  /** 외부 시장 슬롯과 별도 — `feature_snapshot`·구간 점수·진단 문자열만으로 계산 */
  internalChannelDnaSummary: InternalChannelDnaSummaryVm;
};

export function buildChannelDnaPageViewModel(
  data: AnalysisPageData | null
): ChannelDnaPageViewModel {
  const menu = deriveExtensionMenuFields(data, "channel_dna");
  const hasChannel = !!(
    data &&
    data.channels.length > 0 &&
    data.selectedChannel
  );
  const selectedChannelId = data?.selectedChannel?.id ?? null;
  const yt = pickYoutubeAccessFieldsFromPageData(data);
  const channelDnaMenuStrategy = getMenuExtensionStrategy("channel_dna");
  const internalChannelDnaSummary = buildInternalChannelDnaSummary(data);

  return {
    hasChannel,
    selectedChannelId,
    menuStatus: menu.menuStatus,
    lastRunAt: menu.lastRunAt,
    analysisRunsLoaded: deriveAnalysisRunsLoaded(data),
    coreAnalysisFeaturesEnabled: yt.coreAnalysisFeaturesEnabled,
    youtubeVerificationUi: yt.youtubeVerificationUi,
    marketDataAvailability: DEFAULT_MARKET_DATA_AVAILABILITY,
    externalChannels: [],
    comparativeMetrics: null,
    patternInsights: null,
    trendSignals: null,
    extensionNotice: [
      "Channel DNA는 저장된 채널 스냅샷(analysis_results + feature_snapshot)과 공개 API 지표를 기반으로 성과 구조·패턴을 설명합니다. 외부 시장 확장 슬롯은 별도이며, 연동 시 동일 메뉴에서 추가합니다.",
      `확장 정책: ${channelDnaMenuStrategy.runSemantics}`,
    ].join(" "),
    internalChannelDnaSummary,
  };
}
