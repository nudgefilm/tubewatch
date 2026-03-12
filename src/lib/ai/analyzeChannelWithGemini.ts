import {
  getGeminiConfig,
  type TubeWatchAnalysisResult,
} from "@/lib/ai/getGeminiConfig";
import type { AnalysisContext } from "@/lib/analysis/engine/types";

export type ChannelVideoSample = {
  videoId: string;
  title: string;
  publishedAt: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  duration: string | null;

  description?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  categoryId?: string | null;
};

export type AnalyzeChannelWithGeminiArgs = {
  channelTitle: string;
  subscriberCount: number | null;
  videos: ChannelVideoSample[];
  analysisContext?: AnalysisContext;
};

export type AnalyzeChannelWithGeminiSuccess = {
  ok: true;
  model: string;
  result: TubeWatchAnalysisResult;
  rawJson: string;
  usage?: unknown;
};

export type AnalyzeChannelWithGeminiFailure = {
  ok: false;
  model: string;
  error: string;
  rawJson: string;
  usage?: unknown;
};

export type AnalyzeChannelWithGeminiResult =
  | AnalyzeChannelWithGeminiSuccess
  | AnalyzeChannelWithGeminiFailure;

type GeminiCallSuccess = {
  ok: true;
  rawText: string;
  rawBody: string;
  usage: unknown;
};

type GeminiCallFailure = {
  ok: false;
  rawText: "";
  rawBody: string;
  error: string;
};

type GeminiCallResult = GeminiCallSuccess | GeminiCallFailure;

type JsonObject = Record<string, unknown>;

const MAX_ITEM_LENGTH = 120;

const ARRAY_SOFT_LIMITS: Record<string, number> = {
  strengths: 4,
  weaknesses: 4,
  bottlenecks: 3,
  growth_action_plan: 5,
  content_patterns: 4,
  target_audience: 4,
  recommended_topics: 4,
};

// ── Text sanitization ──

function sanitizeText(input: string): string {
  return input
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

function extractJsonCandidate(raw: string): string {
  const text = sanitizeText(raw);

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  if (firstBrace !== -1) {
    return text.slice(firstBrace);
  }

  return text;
}

function removeTrailingComma(input: string): string {
  return input.replace(/,\s*([}\]])/g, "$1");
}

function repairJsonStructure(raw: string): string {
  const source = extractJsonCandidate(raw);

  let result = "";
  let inString = false;
  let escape = false;

  let brace = 0;
  let bracket = 0;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    result += ch;

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === "{") brace++;
      if (ch === "}") brace--;
      if (ch === "[") bracket++;
      if (ch === "]") bracket--;
    }
  }

  if (inString) {
    result += '"';
  }

  result = removeTrailingComma(result);

  while (bracket > 0) {
    result += "]";
    bracket--;
  }

  while (brace > 0) {
    result += "}";
    brace--;
  }

  return result.trim();
}

// ── JSON parsing ──

function tryParseJson(candidate: string): {
  parsed: JsonObject | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {
        parsed: null,
        error: "Parsed value is not an object",
      };
    }

    return {
      parsed: parsed as JsonObject,
      error: null,
    };
  } catch (error) {
    return {
      parsed: null,
      error: error instanceof Error ? error.message : "JSON parse error",
    };
  }
}

// ── Insight item normalization ──

const LEADING_MARKER_PATTERN =
  /^(?:[\d]+[.)]\s*|[-*•·‣▸▹►→●○◆◇■□▪▫]\s*|[①②③④⑤⑥⑦⑧⑨⑩]\s*)/;

function stripLeadingMarker(text: string): string {
  return text.replace(LEADING_MARKER_PATTERN, "").trim();
}

function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const cut = text.slice(0, limit);

  const lastKoreanEnd = cut.lastIndexOf("다.");
  if (lastKoreanEnd > limit * 0.5) {
    return cut.slice(0, lastKoreanEnd + 2);
  }

  const lastPeriod = cut.lastIndexOf(".");
  if (lastPeriod > limit * 0.5) {
    return cut.slice(0, lastPeriod + 1);
  }

  return cut.trimEnd();
}

function deduplicateItems(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanInsightArray(items: string[], maxCount: number): string[] {
  const cleaned = items
    .map((item) => stripLeadingMarker(item.trim()))
    .filter((item) => item.length > 0)
    .map((item) => truncateToLimit(item, MAX_ITEM_LENGTH));

  return deduplicateItems(cleaned).slice(0, maxCount);
}

// ── Field normalization ──

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function pickFirstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) return normalized;
  }

  return null;
}

function pickFirstNonEmptyArray(...values: unknown[]): string[] {
  for (const value of values) {
    const normalized = normalizeStringArray(value);
    if (normalized.length > 0) return normalized;
  }

  return [];
}

function normalizeConfidence(
  value: unknown
): "low" | "medium" | "high" | null {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return null;
}

function normalizeParsedObject(input: JsonObject): TubeWatchAnalysisResult {
  const rawContentPatterns = pickFirstNonEmptyArray(
    input.content_patterns,
    input.content_pillars
  );
  const rawStrengths = pickFirstNonEmptyArray(input.strengths);
  const rawWeaknesses = pickFirstNonEmptyArray(input.weaknesses);
  const rawBottlenecks = pickFirstNonEmptyArray(
    input.bottlenecks,
    input.risks
  );
  const rawRecommendedTopics = pickFirstNonEmptyArray(
    input.recommended_topics,
    input.content_ideas
  );
  const rawGrowthActionPlan = pickFirstNonEmptyArray(
    input.growth_action_plan,
    input.quick_wins
  );
  const rawTargetAudience = pickFirstNonEmptyArray(input.target_audience);

  return {
    version: pickFirstNonEmptyString(input.version) ?? "1.0",
    channel_summary: pickFirstNonEmptyString(input.channel_summary) ?? "",
    content_pattern_summary:
      pickFirstNonEmptyString(input.content_pattern_summary) ?? "",
    content_patterns: cleanInsightArray(
      rawContentPatterns,
      ARRAY_SOFT_LIMITS.content_patterns
    ),
    target_audience: cleanInsightArray(
      rawTargetAudience,
      ARRAY_SOFT_LIMITS.target_audience
    ),
    strengths: cleanInsightArray(
      rawStrengths,
      ARRAY_SOFT_LIMITS.strengths
    ),
    weaknesses: cleanInsightArray(
      rawWeaknesses,
      ARRAY_SOFT_LIMITS.weaknesses
    ),
    bottlenecks: cleanInsightArray(
      rawBottlenecks,
      ARRAY_SOFT_LIMITS.bottlenecks
    ),
    recommended_topics: cleanInsightArray(
      rawRecommendedTopics,
      ARRAY_SOFT_LIMITS.recommended_topics
    ),
    growth_action_plan: cleanInsightArray(
      rawGrowthActionPlan,
      ARRAY_SOFT_LIMITS.growth_action_plan
    ),
    analysis_confidence:
      normalizeConfidence(input.analysis_confidence) ?? "low",
    interpretation_mode:
      pickFirstNonEmptyString(input.interpretation_mode) ??
      "early_stage_signal_based",
    sample_size_note: pickFirstNonEmptyString(input.sample_size_note) ?? "",
  };
}

// ── Response parsing ──

function tryParseGeminiResponse(
  rawText: string
): { parsed: TubeWatchAnalysisResult | null; error: string | null } {
  const attempts = [
    rawText,
    sanitizeText(rawText),
    extractJsonCandidate(rawText),
    repairJsonStructure(rawText),
  ];

  let lastError: string | null = null;

  for (const candidate of attempts) {
    const result = tryParseJson(candidate);

    if (!result.parsed) {
      lastError = result.error;
      continue;
    }

    const normalized = normalizeParsedObject(result.parsed);

    if (normalized.channel_summary.length > 20) {
      return {
        parsed: normalized,
        error: null,
      };
    }

    lastError = "channel_summary가 너무 짧음";
  }

  return {
    parsed: null,
    error: lastError ?? "Gemini JSON 파싱 실패",
  };
}

// ── Gemini API call ──

function extractResponseText(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const root = data as { candidates?: unknown };
  const candidates = root.candidates;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "";
  }

  const first = candidates[0] as { content?: { parts?: unknown } };
  const parts = first.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  const texts = parts.map((part) => {
    if (!part || typeof part !== "object") {
      return "";
    }

    const candidatePart = part as { text?: unknown };
    return typeof candidatePart.text === "string" ? candidatePart.text : "";
  });

  return texts.join("").trim();
}

async function callGemini(
  endpoint: string,
  apiKey: string,
  generationConfig: ReturnType<typeof getGeminiConfig>["generationConfig"],
  prompt: string,
  systemInstruction: string
): Promise<GeminiCallResult> {
  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig,
  };

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const rawBody = await response.text();
  const parsedBody = rawBody ? (JSON.parse(rawBody) as unknown) : null;

  if (!response.ok) {
    let message = "Gemini API 오류";

    if (parsedBody && typeof parsedBody === "object") {
      const root = parsedBody as { error?: { message?: unknown } };
      const candidateMessage = root.error?.message;

      if (typeof candidateMessage === "string" && candidateMessage.length > 0) {
        message = candidateMessage;
      }
    }

    return {
      ok: false as const,
      rawText: "",
      rawBody,
      error: message,
    };
  }

  const rawText = extractResponseText(parsedBody);

  let usage: unknown = undefined;
  if (parsedBody && typeof parsedBody === "object") {
    const root = parsedBody as { usageMetadata?: unknown };
    usage = root.usageMetadata;
  }

  return {
    ok: true as const,
    rawText,
    rawBody,
    usage,
  };
}

// ── Prompt construction ──

function formatNumber(value: number | null): string {
  if (value == null) return "unknown";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRatio(value: number): string {
  return (value * 100).toFixed(2) + "%";
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function buildContextSection(ctx: AnalysisContext): string {
  const m = ctx.metrics;
  const metricsBlock = [
    `[사전 분석 메트릭]`,
    `avg_view_count: ${formatNumber(m.avgViewCount)}`,
    `median_view_count: ${formatNumber(m.medianViewCount)}`,
    `avg_like_ratio: ${formatRatio(m.avgLikeRatio)}`,
    `avg_comment_ratio: ${formatRatio(m.avgCommentRatio)}`,
    `avg_video_duration: ${formatSeconds(m.avgVideoDuration)}`,
    `avg_upload_interval_days: ${m.avgUploadIntervalDays.toFixed(1)}`,
    `recent_30d_upload_count: ${m.recent30dUploadCount}`,
    `avg_title_length: ${m.avgTitleLength.toFixed(1)}`,
    `avg_tag_count: ${m.avgTagCount.toFixed(1)}`,
  ].join("\n");

  const patternsBlock =
    ctx.patterns.flags.length > 0
      ? [
          `[감지된 패턴]`,
          ...ctx.patterns.flags.map((f) => `- ${f}`),
        ].join("\n")
      : `[감지된 패턴]\n- 특이 패턴 없음`;

  const s = ctx.scores;
  const scoresBlock = [
    `[섹션 스코어 (0~100)]`,
    `channel_activity_score: ${s.channelActivityScore.toFixed(1)}`,
    `content_structure_score: ${s.contentStructureScore.toFixed(1)}`,
    `seo_score: ${s.seoScore.toFixed(1)}`,
    `audience_response_score: ${s.audienceResponseScore.toFixed(1)}`,
    `growth_potential_score: ${s.growthPotentialScore.toFixed(1)}`,
    `total_score: ${s.totalScore.toFixed(1)}`,
  ].join("\n");

  return [metricsBlock, "", patternsBlock, "", scoresBlock].join("\n");
}

function buildPrompt(args: AnalyzeChannelWithGeminiArgs): string {
  const videoLines = args.videos.map((video, index) => {
    return [
      `${index + 1}. title: ${video.title}`,
      `published_at: ${video.publishedAt ?? "unknown"}`,
      `views: ${video.viewCount ?? "unknown"}`,
      `likes: ${video.likeCount ?? "unknown"}`,
      `comments: ${video.commentCount ?? "unknown"}`,
      `duration: ${video.duration ?? "unknown"}`,
    ].join("\n");
  });

  const contextBlock = args.analysisContext
    ? buildContextSection(args.analysisContext) + "\n\n"
    : "";

  return `
당신은 YouTube 채널 성장 분석가입니다.

아래 채널 데이터와 사전 분석 결과를 근거로 보수적으로 분석하세요.
데이터가 부족하면 확정적으로 말하지 말고 관찰 기반으로 서술하세요.
출력은 반드시 JSON만 반환하세요.

[채널 정보]
channel_title: ${args.channelTitle}
subscriber_count: ${formatNumber(args.subscriberCount)}
sample_video_count: ${args.videos.length}

${contextBlock}[최근 영상 샘플]
${videoLines.join("\n\n")}

[작성 규칙]
- 위 메트릭과 패턴, 스코어를 근거로 분석하세요
- 메트릭 수치를 구체적으로 인용하세요 (예: "평균 조회수 1,234회로 노출이 제한적입니다", "좋아요 비율 3.2%로 양호합니다")
- 감지된 패턴이 있으면 해당 패턴을 분석에 반영하세요
- 스코어가 낮은 영역의 개선점을 우선 제시하세요
- 과장 금지
- 확인되지 않은 추정 금지
- 표본이 적으면 analysis_confidence를 낮게 설정
- sample_size_note에 표본 한계 명시
- 성장 액션은 바로 실행 가능한 문장으로 작성

[문장 형식 규칙]
- 모든 배열 항목은 완결된 한 문장으로 작성합니다
- 각 문장은 120자 이내로 작성합니다
- 번호(1. 2. 3.)로 시작하지 마세요
- 기호(- * • →)로 시작하지 마세요
- 각 문장에 메트릭 수치를 반드시 1개 이상 인용하세요

[좋은 예시]
"평균 댓글 비율이 0.00%로 시청자 상호작용이 매우 낮습니다."
"평균 영상 길이가 40초 수준으로 숏폼 콘텐츠 중심 채널입니다."
"최근 30일 업로드 수가 0개로 채널 활동성이 부족합니다."

[나쁜 예시]
"1. 최근 30일 동안 영상 업로드가 전혀 없는 상태입니다."
"- 시청자와의 소통이 부족합니다."
"콘텐츠 전략을 재검토할 필요가 있습니다."
`.trim();
}

const SYSTEM_INSTRUCTION = `당신은 YouTube 채널 데이터 분석 전문가입니다.
반드시 JSON만 반환하세요. JSON 외의 텍스트를 포함하지 마세요.

출력 형식 규칙:
1. 모든 배열 항목은 번호나 기호 없이 완결된 한 문장으로 작성합니다.
2. 각 문장은 120자 이내로 작성합니다.
3. 메트릭 수치(조회수, 비율, 업로드 수 등)를 구체적으로 인용합니다.
4. 과장하지 않고 데이터에 근거한 보수적 분석만 작성합니다.
5. 중복되는 내용을 다른 항목에서 반복하지 마세요.`;

// ── Main entry point ──

export async function analyzeChannelWithGemini(
  args: AnalyzeChannelWithGeminiArgs
): Promise<AnalyzeChannelWithGeminiResult> {
  const { apiKey, endpoint, generationConfig, model } = getGeminiConfig();
  const prompt = buildPrompt(args);

  const first = await callGemini(
    endpoint,
    apiKey,
    generationConfig,
    prompt,
    SYSTEM_INSTRUCTION
  );

  if (!first.ok) {
    return {
      ok: false,
      model,
      error: first.error ?? "Gemini 호출 실패",
      rawJson: first.rawBody,
    };
  }

  const parsed = tryParseGeminiResponse(first.rawText);

  if (parsed.parsed) {
    return {
      ok: true,
      model,
      result: parsed.parsed,
      rawJson: first.rawText,
      usage: first.usage,
    };
  }

  console.error("Gemini JSON parse failed", parsed.error);

  return {
    ok: false,
    model,
    error: parsed.error ?? "JSON parse 실패",
    rawJson: first.rawText,
    usage: first.usage,
  };
}
