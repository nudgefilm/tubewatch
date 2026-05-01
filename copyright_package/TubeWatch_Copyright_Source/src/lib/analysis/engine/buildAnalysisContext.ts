import type {
  AnalysisContext,
  ChannelMetrics,
  ChannelPatterns,
  ChannelSizeTier,
  FeatureScoreResult,
  InterpretationMode,
} from "./types";
import {
  computeAnalysisConfidence,
  computeMetricsCompleteness,
} from "@/lib/analysis/confidence/computeAnalysisConfidence";

export function determineChannelSizeTier(subscriberCount: number): ChannelSizeTier {
  if (subscriberCount >= 100_000) return "large";
  if (subscriberCount >= 10_000) return "medium";
  if (subscriberCount >= 1_000) return "small";
  return "micro";
}

function determineInterpretationMode(tier: ChannelSizeTier): InterpretationMode {
  if (tier === "micro" || tier === "small") return "early_stage_signal_based";
  if (tier === "medium") return "growth_stage_pattern_based";
  return "scale_stage_optimization";
}

function buildInterpretationHints(tier: ChannelSizeTier): string[] {
  switch (tier) {
    case "micro":
      return [
        "구독자 1,000명 미만의 초기 채널이므로 신호 기반으로 보수적 분석",
        "데이터가 제한적이므로 확정적 결론보다 관찰 기반 서술 우선",
        "작은 표본에서 과도한 일반화를 피할 것",
        "실험적 콘텐츠 시도 가능성을 긍정적으로 평가",
      ];
    case "small":
      return [
        "구독자 1,000~10,000명 규모의 성장 초기 채널",
        "업로드 일관성과 시청자 반응 패턴에 집중 분석",
        "성장 궤도 진입 여부를 핵심 판단 기준으로 활용",
        "타겟 시청자 신호가 형성되는 단계로 해석",
      ];
    case "medium":
      return [
        "구독자 10,000~100,000명 규모의 성장기 채널",
        "콘텐츠 최적화와 확장 전략에 집중 분석",
        "콘텐츠 포맷별 성과 차이를 핵심 분석 포인트로 활용",
        "이미 형성된 시청자층의 기대에 부합하는지 평가",
      ];
    case "large":
      return [
        "구독자 100,000명 이상의 대형 채널",
        "시청자 유지율과 성과 편차를 핵심 분석 포인트로 활용",
        "기존 시청자 기대 대비 콘텐츠 일관성 평가",
        "성장 정체 신호와 다각화 가능성에 주목",
      ];
  }
}

export interface BuildAnalysisContextOptions {
  subscriberCount?: number;
  sampleVideoCount?: number;
  collectedVideoCount?: number;
}

export function buildAnalysisContext(
  metrics: ChannelMetrics,
  patterns: ChannelPatterns,
  scoreResult: FeatureScoreResult,
  subscriberCountOrOptions?: number | BuildAnalysisContextOptions
): AnalysisContext {
  const opts: BuildAnalysisContextOptions =
    typeof subscriberCountOrOptions === "number"
      ? { subscriberCount: subscriberCountOrOptions }
      : subscriberCountOrOptions ?? {};

  const tier = determineChannelSizeTier(opts.subscriberCount ?? 0);
  const interpretationMode = determineInterpretationMode(tier);
  const interpretationHints = buildInterpretationHints(tier);

  const metricsCompleteness = computeMetricsCompleteness(
    metrics as unknown as Record<string, unknown>
  );

  const confidence = computeAnalysisConfidence({
    sampleVideoCount: opts.sampleVideoCount ?? 0,
    collectedVideoCount: opts.collectedVideoCount ?? 0,
    channelSizeTier: tier,
    metricsCompleteness,
    patternCount: patterns.flags.length,
  });

  return {
    metrics,
    patterns,
    scores: {
      totalScore: scoreResult.totalScore,
      channelActivityScore: scoreResult.sectionScores.channelActivity,
      contentStructureScore: scoreResult.sectionScores.contentStructure,
      seoScore: scoreResult.sectionScores.seoOptimization,
      audienceResponseScore: scoreResult.sectionScores.audienceResponse,
      growthPotentialScore: scoreResult.sectionScores.growthMomentum,
    },
    channelSizeTier: tier,
    interpretationMode,
    interpretationHints,
    confidence: {
      confidenceScore: confidence.confidenceScore,
      confidenceLevel: confidence.confidenceLevel,
      confidenceReasons: confidence.reasons,
    },
  };
}
