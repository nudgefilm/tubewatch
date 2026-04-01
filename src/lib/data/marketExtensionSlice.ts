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

