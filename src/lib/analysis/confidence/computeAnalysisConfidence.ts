import type { ChannelSizeTier } from "@/lib/analysis/engine/types";

// ── Types ──

export type ConfidenceLevel = "low" | "medium" | "high";

export interface AnalysisConfidence {
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  reasons: string[];
}

export interface ConfidenceInput {
  sampleVideoCount: number;
  collectedVideoCount: number;
  channelSizeTier: ChannelSizeTier;
  metricsCompleteness: number;
  patternCount: number;
}

// ── Metric completeness helper ──

const COMPLETENESS_METRIC_KEYS = [
  "avgViewCount",
  "medianViewCount",
  "avgLikeRatio",
  "avgCommentRatio",
  "avgVideoDuration",
  "avgUploadIntervalDays",
  "recent30dUploadCount",
  "avgTitleLength",
  "avgTagCount",
] as const;

export function computeMetricsCompleteness(
  metrics: Record<string, unknown> | null | undefined
): number {
  if (!metrics || typeof metrics !== "object") return 0;
  const total = COMPLETENESS_METRIC_KEYS.length;
  let present = 0;
  for (const key of COMPLETENESS_METRIC_KEYS) {
    if (typeof (metrics as Record<string, unknown>)[key] === "number") {
      present++;
    }
  }
  return total > 0 ? (present / total) * 100 : 0;
}

// ── Main computation ──

function toConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function computeAnalysisConfidence(input: ConfidenceInput): AnalysisConfidence {
  let score = 50;
  const reasons: string[] = [];

  if (input.sampleVideoCount >= 20) {
    score += 20;
    reasons.push("영상 데이터가 20개로 충분합니다.");
  } else if (input.sampleVideoCount >= 10) {
    score += 10;
    reasons.push(`영상 데이터가 ${input.sampleVideoCount}개로 보통 수준입니다.`);
  } else {
    score -= 20;
    reasons.push(`영상 데이터가 ${input.sampleVideoCount}개로 부족합니다.`);
  }

  if (input.metricsCompleteness >= 90) {
    score += 10;
    reasons.push("핵심 지표가 대부분 계산되었습니다.");
  } else if (input.metricsCompleteness < 60) {
    score -= 10;
    reasons.push(`지표 완전성이 ${Math.round(input.metricsCompleteness)}%로 낮습니다.`);
  } else {
    reasons.push(`지표 완전성이 ${Math.round(input.metricsCompleteness)}%입니다.`);
  }

  if (input.patternCount > 0) {
    score += 10;
    reasons.push(`${input.patternCount}개의 채널 패턴이 감지되었습니다.`);
  } else {
    reasons.push("감지된 패턴이 없어 분석 근거가 제한적입니다.");
  }

  if (input.channelSizeTier === "micro") {
    reasons.push("초기 채널로 데이터 해석에 주의가 필요합니다.");
  }

  const clamped = Math.max(0, Math.min(100, score));

  return {
    confidenceScore: clamped,
    confidenceLevel: toConfidenceLevel(clamped),
    reasons,
  };
}
