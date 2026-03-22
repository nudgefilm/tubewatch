/**
 * 시장/경쟁/패턴/트렌드 데이터 확장용 타입 (외부 API 미연동 단계).
 *
 * 현재 저장소: analysis_results + feature_snapshot ≈ internal_channel_data
 * 아래 placeholder 타입은 향후 행/테이블/API 연결 시 그대로 확장.
 */

/** 내부 채널 분석 묶음 — DB의 analysis_results + feature_snapshot 메타 */
export type InternalChannelDatasetKind = "analysis_results_snapshot";

export type InternalChannelDatasetDescriptor = {
  readonly kind: InternalChannelDatasetKind;
  readonly note: "user_channel scoped; feature_snapshot.metrics|patterns|videos";
};

/** 외부 경쟁 채널 스냅샷 자리 (미연동) */
export type ExternalChannelDataPlaceholder = {
  readonly kind: "placeholder";
  readonly connection: "not_connected";
};

/** 집계 패턴 데이터셋 자리 (스냅샷 플래그 배열과 별도 레이어) */
export type PatternDatasetPlaceholder = {
  readonly kind: "placeholder";
  readonly connection: "not_connected";
};

/** 트렌드/시장 시계열 자리 */
export type TrendDatasetPlaceholder = {
  readonly kind: "placeholder";
  readonly connection: "not_connected";
};

/** UI·뷰모델에서 외부 슬라이스 연결 여부를 명시 */
export type ExternalDataConnectionState =
  | "not_connected"
  | "internal_only"
  | "ready";

export type MarketDataAvailabilityVm = {
  readonly externalChannels: ExternalDataConnectionState;
  readonly patternDataset: ExternalDataConnectionState;
  readonly trendDataset: ExternalDataConnectionState;
  readonly comparativeMetrics: ExternalDataConnectionState;
};

export const DEFAULT_MARKET_DATA_AVAILABILITY: MarketDataAvailabilityVm = {
  externalChannels: "not_connected",
  patternDataset: "not_connected",
  trendDataset: "not_connected",
  comparativeMetrics: "not_connected",
};

/**
 * 비교 지표(백분위, 카테고리 평균 등) — 데이터 없으면 null
 * 향후: { kind: "ready"; ... } 유니온으로 확장
 */
export type ComparativeMetricsVm = null;

/**
 * 패턴 집계 레이어(크로스 채널) — 스냅샷 patterns[]와 별도
 * /seo-lab 의 patternInsights(카드 배열)와 이름이 겹치지 않도록 Dataset 접미사
 */
export type PatternInsightsDatasetVm = null;

/** 트렌드 신호 — 데이터 없으면 null */
export type TrendSignalsVm = null;

/** 벤치마크용 외부 채널 슬롯 (현재 빈 배열) */
export type BenchmarkExternalChannelVm = {
  readonly id: string;
  readonly label: string;
  readonly connectionState: "pending_connection";
};

/**
 * 내부 벤치마크 요약은 `marketDataAvailability`·`comparativeMetrics`와 충돌하지 않도록
 * `BenchmarkPageViewModel.internalBenchmarkSummary`(`@/lib/benchmark/internalBenchmarkSummary`)에 둔다.
 */
