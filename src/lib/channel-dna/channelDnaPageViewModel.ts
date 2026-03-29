import type { AnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
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
import type { StrategicCommentVm } from "@/lib/shared/strategicCommentTypes";
import { makeDiagnosticLabel } from "@/lib/utils/labelUtils";

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
  /** 페이지 하단 전략 코멘트 카드 */
  strategicComment: StrategicCommentVm | null;
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
  const internalChannelDnaSummary = buildInternalChannelDnaSummary(data);
  const strategicComment = buildChannelDnaStrategicComment(internalChannelDnaSummary);

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
    extensionNotice:
      "Channel DNA는 저장된 분석 결과와 채널 지표를 기반으로 성과 구조·패턴을 설명합니다. 외부 시장 확장 슬롯은 별도이며, 연동 시 동일 메뉴에서 추가합니다.",
    internalChannelDnaSummary,
    strategicComment,
  };
}

function buildChannelDnaStrategicComment(
  vm: InternalChannelDnaSummaryVm
): StrategicCommentVm | null {
  if (!vm.dominantFormat && vm.topPatternSignals.length === 0) return null;

  const formatLabel = vm.dominantFormat ?? "포맷 데이터 없음";
  const headlineBase = vm.dominantFormat
    ? `${vm.dominantFormat} 중심 채널 구조`
    : "채널 성과 구조 분석";

  // 1문장: 핵심 문제 (가장 약한 신호 기반)
  const summaryParts: string[] = [];
  if (vm.weakPatternSignals.length > 0) {
    summaryParts.push(`${makeDiagnosticLabel(vm.weakPatternSignals[0])} 부분이 현재 가장 약한 축입니다.`);
  } else if (vm.dominantFormat) {
    summaryParts.push(`${vm.dominantFormat} 구조로 운영되고 있습니다.`);
  } else {
    summaryParts.push("채널 성과 구조를 분석했습니다.");
  }

  // 2문장: 영향
  if (vm.breakoutDependencyLevel === "high") {
    summaryParts.push("히트 영상 의존이 높아 성과의 안정성이 낮을 수 있습니다.");
  } else if (vm.uploadConsistencyLevel === "low") {
    summaryParts.push("업로드 주기가 불규칙하면 시청자 유입이 끊어질 수 있습니다.");
  } else if (vm.topPatternSignals.length > 0) {
    summaryParts.push(`${makeDiagnosticLabel(vm.topPatternSignals[0])} 강점이 성장의 핵심 레버입니다.`);
  }

  // 3문장: 방향
  if (vm.weakPatternSignals.length > 0) {
    summaryParts.push("약한 축을 집중 점검하면서 강점 패턴을 유지하세요.");
  } else {
    summaryParts.push("현재 강점을 일관되게 유지하는 것이 중요합니다.");
  }

  const takeaways: string[] = [];
  if (vm.dominantFormat) takeaways.push(`주요 포맷 — ${formatLabel}`);
  if (vm.topPatternSignals.length > 0) takeaways.push(`반복 강점 — ${makeDiagnosticLabel(vm.topPatternSignals[0])}`);
  if (vm.weakPatternSignals.length > 0) takeaways.push(`약한 축 — ${makeDiagnosticLabel(vm.weakPatternSignals[0])}`);

  const caution =
    vm.topPatternSignals.length === 0 && vm.weakPatternSignals.length === 0
      ? "분석을 다시 실행하면 더 정교한 진단이 가능합니다."
      : null;

  return {
    headline: headlineBase,
    summary: summaryParts.slice(0, 3).join(" "),
    keyTakeaways: takeaways.slice(0, 3),
    priorityAction:
      vm.weakPatternSignals.length > 0
        ? `${makeDiagnosticLabel(vm.weakPatternSignals[0])} 집중 점검`
        : null,
    caution,
  };
}
