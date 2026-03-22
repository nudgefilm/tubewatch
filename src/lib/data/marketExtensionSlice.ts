import {
  DEFAULT_MARKET_DATA_AVAILABILITY,
  type ComparativeMetricsVm,
  type MarketDataAvailabilityVm,
  type PatternInsightsDatasetVm,
  type TrendSignalsVm,
} from "@/lib/data/marketExtensionTypes";

/** /analysis, /action-plan 등에 spread */
export type MarketExtensionSliceVm = {
  marketDataAvailability: MarketDataAvailabilityVm;
  internalDataset: {
    readonly kind: "analysis_results_snapshot";
  };
  comparativeMetrics: ComparativeMetricsVm;
  /**
   * 집계 패턴 분석 슬롯(외부 pattern_dataset). 스냅샷 `patterns[]` UI와 별개.
   * 현재 null — /seo-lab 은 동일 이름으로 스냅샷 카드 배열을 이미 쓰므로 이 필드는 제외.
   */
  patternInsights: PatternInsightsDatasetVm;
  trendSignals: TrendSignalsVm;
};

export function buildDefaultMarketExtensionSlice(): MarketExtensionSliceVm {
  return {
    marketDataAvailability: DEFAULT_MARKET_DATA_AVAILABILITY,
    internalDataset: { kind: "analysis_results_snapshot" },
    comparativeMetrics: null,
    patternInsights: null,
    trendSignals: null,
  };
}

/** /seo-lab: `patternInsights`는 이미 스냅샷 카드 배열로 사용 중 → 슬롯 필드 제외 */
export type SeoLabMarketExtensionFieldsVm = Pick<
  MarketExtensionSliceVm,
  "marketDataAvailability" | "internalDataset" | "comparativeMetrics" | "trendSignals"
>;

export function buildSeoLabMarketExtensionSlice(): SeoLabMarketExtensionFieldsVm {
  return {
    marketDataAvailability: DEFAULT_MARKET_DATA_AVAILABILITY,
    internalDataset: { kind: "analysis_results_snapshot" },
    comparativeMetrics: null,
    trendSignals: null,
  };
}
