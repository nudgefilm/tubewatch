import type { ChannelDnaTriLevel, InternalChannelDnaSummaryVm } from "@/lib/channel-dna/internalChannelDnaSummary";

/**
 * 액션 플랜 룰에서만 쓰는 채널 DNA 신호 슬라이스.
 * 전체 `ChannelDnaPageViewModel`이나 스냅샷 원본에 직접 의존하지 않습니다.
 */
export type ChannelDnaSignalsForActionPlan = {
  readonly recentVideosUsed: number;
  readonly breakoutDependencyLevel: ChannelDnaTriLevel | null;
  readonly breakoutDependencyFallback: string | null;
  readonly top3Share: number | null;
  readonly topPerformerShare: number | null;
  readonly performanceSpreadLevel: ChannelDnaTriLevel | null;
  readonly performanceSpreadFallback: string | null;
  readonly uploadConsistencyLevel: ChannelDnaTriLevel | null;
  readonly uploadConsistencyFallback: string | null;
  readonly dominantFormat: string | null;
  readonly topPatternSignals: readonly string[];
};

export function pickChannelDnaSignalsForActionPlan(
  vm: InternalChannelDnaSummaryVm
): ChannelDnaSignalsForActionPlan {
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
