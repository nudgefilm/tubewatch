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
  type BenchmarkExternalChannelVm,
  type ComparativeMetricsVm,
  type MarketDataAvailabilityVm,
  type PatternInsightsDatasetVm,
  type TrendSignalsVm,
} from "@/lib/data/marketExtensionTypes";
import {
  buildInternalBenchmarkSummary,
  type InternalBenchmarkSummaryVm,
} from "@/lib/benchmark/internalBenchmarkSummary";

/**
 * /benchmark 확장용 뷰모델.
 * 외부 경쟁 채널·시장 평균 미연동 시 externalChannels 는 빈 배열 유지.
 */
export type BenchmarkPageViewModel = {
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
  externalChannels: BenchmarkExternalChannelVm[];
  comparativeMetrics: ComparativeMetricsVm;
  patternInsights: PatternInsightsDatasetVm;
  trendSignals: TrendSignalsVm;
  extensionNotice: string | null;
  /** 외부 시장 슬롯과 별도 — `feature_snapshot`·구간 점수·진단 문자열만으로 계산 */
  internalBenchmarkSummary: InternalBenchmarkSummaryVm;
};

export function buildBenchmarkPageViewModel(
  data: AnalysisPageData | null
): BenchmarkPageViewModel {
  const menu = deriveExtensionMenuFields(data, "benchmark");
  const hasChannel = !!(
    data &&
    data.channels.length > 0 &&
    data.selectedChannel
  );
  const selectedChannelId = data?.selectedChannel?.id ?? null;
  const yt = pickYoutubeAccessFieldsFromPageData(data);
  const benchStrategy = getMenuExtensionStrategy("benchmark");
  const internalBenchmarkSummary = buildInternalBenchmarkSummary(data);

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
      "경쟁 채널·시장 벤치마크용 외부 데이터는 연결되지 않았습니다. internal_channel_data(analysis_results + feature_snapshot)만 존재하며, 비교 지표는 추후 연동 시 채워집니다.",
      `확장 정책: ${benchStrategy.runSemantics}`,
    ].join(" "),
    internalBenchmarkSummary,
  };
}
