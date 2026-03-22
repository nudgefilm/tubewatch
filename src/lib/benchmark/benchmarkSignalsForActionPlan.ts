import type { BenchmarkTriLevel, InternalBenchmarkSummaryVm } from "@/lib/benchmark/internalBenchmarkSummary";

/**
 * 액션 플랜 룰에서만 쓰는 벤치마크 신호 슬라이스.
 * 전체 `BenchmarkPageViewModel`이나 스냅샷 원본에 직접 의존하지 않습니다.
 */
export type BenchmarkSignalsForActionPlan = {
  readonly recentVideosUsed: number;
  readonly breakoutDependencyLevel: BenchmarkTriLevel | null;
  readonly breakoutDependencyFallback: string | null;
  readonly top3Share: number | null;
  readonly topPerformerShare: number | null;
  readonly performanceSpreadLevel: BenchmarkTriLevel | null;
  readonly performanceSpreadFallback: string | null;
  readonly uploadConsistencyLevel: BenchmarkTriLevel | null;
  readonly uploadConsistencyFallback: string | null;
  readonly dominantFormat: string | null;
  readonly topPatternSignals: readonly string[];
};

export function pickBenchmarkSignalsForActionPlan(
  vm: InternalBenchmarkSummaryVm
): BenchmarkSignalsForActionPlan {
  return {
    recentVideosUsed: vm.recentVideosUsed,
    breakoutDependencyLevel: vm.breakoutDependencyLevel,
    breakoutDependencyFallback: vm.breakoutDependencyFallback,
    top3Share: vm.top3Share,
    topPerformerShare: vm.topPerformerShare,
    performanceSpreadLevel: vm.performanceSpreadLevel,
    performanceSpreadFallback: vm.performanceSpreadFallback,
    uploadConsistencyLevel: vm.uploadConsistencyLevel,
    uploadConsistencyFallback: vm.uploadConsistencyFallback,
    dominantFormat: vm.dominantFormat,
    topPatternSignals: vm.topPatternSignals,
  };
}
