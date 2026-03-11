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

function sanitizeText(input: string): string {
  return input
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
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
  return {
    version: pickFirstNonEmptyString(input.version) ?? "1.0",
    channel_summary: pickFirstNonEmptyString(input.channel_summary) ?? "",
    content_pattern_summary:
      pickFirstNonEmptyString(input.content_pattern_summary) ?? "",
    content_patterns: pickFirstNonEmptyArray(
      input.content_patterns,
      input.content_pillars
    ),
    target_audience: pickFirstNonEmptyArray(input.target_audience),
    strengths: pickFirstNonEmptyArray(input.strengths),
    weaknesses: pickFirstNonEmptyArray(input.weaknesses),
    bottlenecks: pickFirstNonEmptyArray(input.bottlenecks, input.risks),
    recommended_topics: pickFirstNonEmptyArray(
      input.recommended_topics,
      input.content_ideas
    ),
    growth_action_plan: pickFirstNonEmptyArray(
      input.growth_action_plan,
      input.quick_wins
    ),
    analysis_confidence:
      normalizeConfidence(input.analysis_confidence) ?? "low",
    interpretation_mode:
      pickFirstNonEmptyString(input.interpretation_mode) ??
      "early_stage_signal_based",
    sample_size_note: pickFirstNonEmptyString(input.sample_size_note) ?? "",
  };
}

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
- 메트릭 수치를 구체적으로 인용하세요
- 감지된 패턴이 있으면 해당 패턴을 분석에 반영하세요
- 스코어가 낮은 영역의 개선점을 우선 제시하세요
- 과장 금지
- 확인되지 않은 추정 금지
- 표본이 적으면 analysis_confidence를 낮게 설정
- sample_size_note에 표본 한계 명시
- 성장 액션은 바로 실행 가능한 문장으로 작성
`.trim();
}

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
    "반드시 JSON만 반환하세요."
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