import type {
  AnalysisContext,
  ChannelMetrics,
  ChannelPatterns,
  FeatureScoreResult,
} from "./types";

export function buildAnalysisContext(
  metrics: ChannelMetrics,
  patterns: ChannelPatterns,
  scoreResult: FeatureScoreResult
): AnalysisContext {
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
  };
}
