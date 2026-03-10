import {
  getGeminiConfig,
  type TubeWatchAnalysisResult,
} from "@/lib/ai/getGeminiConfig";

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

function tryParseJson(candidate: string) {
  try {
    return {
      parsed: JSON.parse(candidate) as Record<string, unknown>,
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

function normalizeParsedObject(
  input: Record<string, unknown>
): TubeWatchAnalysisResult {
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

function tryParseGeminiResponse(rawText: string) {
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

function extractResponseText(data: any): string {
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts;

  if (!Array.isArray(parts)) return "";

  return parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

async function callGemini(
  endpoint: string,
  apiKey: string,
  generationConfig: ReturnType<typeof getGeminiConfig>["generationConfig"],
  prompt: string,
  systemInstruction: string
) {
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
  const data = rawBody ? JSON.parse(rawBody) : null;

  if (!response.ok) {
    return {
      ok: false as const,
      rawText: "",
      rawBody,
      error: data?.error?.message ?? "Gemini API 오류",
    };
  }

  const rawText = extractResponseText(data);

  return {
    ok: true as const,
    rawText,
    rawBody,
    usage: data?.usageMetadata,
  };
}

function formatNumber(value: number | null): string {
  if (value == null) return "unknown";
  return new Intl.NumberFormat("en-US").format(value);
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

  return `
당신은 YouTube 채널 성장 분석가입니다.

아래 채널 데이터만 근거로 보수적으로 분석하세요.
데이터가 부족하면 확정적으로 말하지 말고 관찰 기반으로 서술하세요.
출력은 반드시 JSON만 반환하세요.

[채널 정보]
channel_title: ${args.channelTitle}
subscriber_count: ${formatNumber(args.subscriberCount)}
sample_video_count: ${args.videos.length}

[최근 영상 샘플]
${videoLines.join("\n\n")}

[작성 규칙]
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