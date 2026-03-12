// ── Types ──

export type ValidationIssueType =
  | "missing_metric"
  | "empty_insight"
  | "inconsistency"
  | "generic_text";

export interface ValidationIssue {
  type: ValidationIssueType;
  message: string;
}

export interface ValidationResult {
  analysis_id: string;
  channel_title: string;
  created_at: string | null;
  issues: ValidationIssue[];
  score: number;
}

export interface AnalysisRow {
  id: string;
  channel_title: string | null;
  status: string | null;
  gemini_status: string | null;
  sample_video_count: number | null;
  feature_snapshot: Record<string, unknown> | null;
  feature_total_score: number | null;
  channel_summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  growth_action_plan: string[] | null;
  content_patterns: string[] | null;
  recommended_topics: string[] | null;
  target_audience: string[] | null;
  created_at: string | null;
}

type ChannelMetricsPartial = {
  avgViewCount?: number;
  avgLikeRatio?: number;
  avgCommentRatio?: number;
  avgUploadIntervalDays?: number;
  recent30dUploadCount?: number;
  avgTagCount?: number;
};

// ── Score penalties ──

const PENALTY: Record<ValidationIssueType, number> = {
  missing_metric: 10,
  empty_insight: 10,
  inconsistency: 15,
  generic_text: 5,
};

// ── Metric extraction ──

const REQUIRED_METRIC_KEYS: (keyof ChannelMetricsPartial)[] = [
  "avgViewCount",
  "avgLikeRatio",
  "avgCommentRatio",
  "avgUploadIntervalDays",
  "recent30dUploadCount",
];

function extractMetrics(snapshot: Record<string, unknown> | null): ChannelMetricsPartial | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = snapshot.metrics;
  if (!raw || typeof raw !== "object") return null;
  return raw as Record<string, unknown> as ChannelMetricsPartial;
}

// ── Array helpers ──

function safeArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string" && v.trim().length > 0);
}

function joinAllInsights(row: AnalysisRow): string[] {
  return [
    ...safeArray(row.strengths),
    ...safeArray(row.weaknesses),
    ...safeArray(row.bottlenecks),
    ...safeArray(row.growth_action_plan),
    ...safeArray(row.content_patterns),
    ...safeArray(row.recommended_topics),
    ...safeArray(row.target_audience),
  ];
}

// ── Check A: Metrics presence ──

function checkMetricsPresence(snapshot: Record<string, unknown> | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!snapshot) {
    issues.push({
      type: "missing_metric",
      message: "feature_snapshot이 존재하지 않습니다.",
    });
    return issues;
  }

  const metrics = extractMetrics(snapshot);
  if (!metrics) {
    issues.push({
      type: "missing_metric",
      message: "feature_snapshot.metrics가 존재하지 않습니다.",
    });
    return issues;
  }

  for (const key of REQUIRED_METRIC_KEYS) {
    if (typeof metrics[key] !== "number") {
      issues.push({
        type: "missing_metric",
        message: `메트릭 ${key}이(가) 누락되었습니다.`,
      });
    }
  }

  return issues;
}

// ── Check B: Insight completeness ──

const REQUIRED_INSIGHT_FIELDS: { key: keyof AnalysisRow; label: string }[] = [
  { key: "channel_summary", label: "channel_summary" },
  { key: "strengths", label: "strengths" },
  { key: "weaknesses", label: "weaknesses" },
  { key: "growth_action_plan", label: "growth_action_plan" },
];

function checkInsightCompleteness(row: AnalysisRow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const field of REQUIRED_INSIGHT_FIELDS) {
    const value = row[field.key];

    if (field.key === "channel_summary") {
      if (typeof value !== "string" || value.trim().length === 0) {
        issues.push({
          type: "empty_insight",
          message: `${field.label}이(가) 비어 있습니다.`,
        });
      }
      continue;
    }

    if (safeArray(value as string[] | null).length === 0) {
      issues.push({
        type: "empty_insight",
        message: `${field.label} 배열이 비어 있습니다.`,
      });
    }
  }

  return issues;
}

// ── Check C: Metrics vs insight consistency ──

interface ConsistencyRule {
  condition: (m: ChannelMetricsPartial) => boolean;
  conflictPatterns: RegExp[];
  message: string;
}

const CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    condition: (m) => (m.recent30dUploadCount ?? 0) === 0,
    conflictPatterns: [/활발한\s*업로드/, /꾸준한\s*업로드/, /높은\s*업로드\s*빈도/, /정기적.*업로드/],
    message: "recent30dUploadCount=0이지만 인사이트에서 활발한 업로드를 언급합니다.",
  },
  {
    condition: (m) => (m.avgCommentRatio ?? 0) < 0.001,
    conflictPatterns: [/높은\s*참여도/, /활발한\s*댓글/, /댓글.*활발/, /높은\s*상호작용/],
    message: "avgCommentRatio<0.1%이지만 인사이트에서 높은 참여도를 언급합니다.",
  },
  {
    condition: (m) => (m.avgViewCount ?? 0) < 100,
    conflictPatterns: [/높은\s*조회/, /많은\s*조회/, /조회수.*높/],
    message: "avgViewCount<100이지만 인사이트에서 높은 조회수를 언급합니다.",
  },
  {
    condition: (m) => (m.avgLikeRatio ?? 0) < 0.005,
    conflictPatterns: [/높은\s*좋아요/, /좋아요.*높/, /좋아요\s*비율.*양호/],
    message: "avgLikeRatio<0.5%이지만 인사이트에서 높은 좋아요 비율을 언급합니다.",
  },
  {
    condition: (m) => (m.avgUploadIntervalDays ?? 0) > 30,
    conflictPatterns: [/꾸준한\s*업로드/, /정기적.*업로드/, /안정적.*업로드\s*주기/],
    message: "avgUploadIntervalDays>30이지만 인사이트에서 꾸준한 업로드를 언급합니다.",
  },
];

function checkMetricsInsightConsistency(row: AnalysisRow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const metrics = extractMetrics(row.feature_snapshot);
  if (!metrics) return issues;

  const allText = joinAllInsights(row).join(" ");
  if (allText.length === 0) return issues;

  for (const rule of CONSISTENCY_RULES) {
    if (!rule.condition(metrics)) continue;

    const hasConflict = rule.conflictPatterns.some((pattern) => pattern.test(allText));
    if (hasConflict) {
      issues.push({
        type: "inconsistency",
        message: rule.message,
      });
    }
  }

  return issues;
}

// ── Check D: Generic text detection ──

const GENERIC_PHRASES = [
  /^최근 영상/,
  /^일부 영상/,
  /^전반적으로/,
  /^대체로/,
  /^전체적으로/,
  /^일반적으로/,
];

const METRIC_REFERENCE_PATTERN = /\d+(\.\d+)?(%|회|개|일|분|초|K|M|시간)/;

function checkGenericText(row: AnalysisRow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allItems = joinAllInsights(row);

  for (const item of allItems) {
    const trimmed = item.trim();

    const isGenericStart = GENERIC_PHRASES.some((p) => p.test(trimmed));
    const hasMetricRef = METRIC_REFERENCE_PATTERN.test(trimmed);

    if (isGenericStart && !hasMetricRef) {
      const preview = trimmed.length > 50 ? trimmed.slice(0, 50) + "…" : trimmed;
      issues.push({
        type: "generic_text",
        message: `메트릭 참조 없이 추상적 표현 사용: "${preview}"`,
      });
    }
  }

  return issues;
}

// ── Main validation entry ──

export function validateAnalysisResult(row: AnalysisRow): ValidationResult {
  const issues: ValidationIssue[] = [
    ...checkMetricsPresence(row.feature_snapshot),
    ...checkInsightCompleteness(row),
    ...checkMetricsInsightConsistency(row),
    ...checkGenericText(row),
  ];

  let score = 100;
  for (const issue of issues) {
    score -= PENALTY[issue.type];
  }
  score = Math.max(0, score);

  return {
    analysis_id: row.id,
    channel_title: row.channel_title ?? "알 수 없는 채널",
    created_at: row.created_at,
    issues,
    score,
  };
}

export function validateMultipleResults(rows: AnalysisRow[]): ValidationResult[] {
  return rows.map(validateAnalysisResult);
}
