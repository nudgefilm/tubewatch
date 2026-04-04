import {
  getGeminiConfig,
  type TubeWatchAnalysisResult,
  type NextTrendAIPlan,
  type ActionExecutionHint,
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
  title_candidates: 3,
  recommended_tags: 8,
  action_execution_hints: 5,
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

function normalizeNextTrendPlan(raw: unknown): NextTrendAIPlan | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const topic = normalizeString(obj.topic);
  const why = normalizeString(obj.why_this_topic);
  const pain = normalizeString(obj.pain_point);
  if (!topic || !why || !pain) return null;
  const titles = cleanInsightArray(normalizeStringArray(obj.title_candidates), 3);
  const tags = cleanInsightArray(normalizeStringArray(obj.recommended_tags), 8);
  return {
    topic: truncateToLimit(topic, 40),
    why_this_topic: truncateToLimit(why, 300),
    pain_point: truncateToLimit(pain, 200),
    content_angle: truncateToLimit(normalizeString(obj.content_angle) ?? "", 150),
    opening_hook: truncateToLimit(normalizeString(obj.opening_hook) ?? "", 150),
    title_candidates: titles.length > 0 ? titles : [],
    recommended_tags: tags,
  };
}

function normalizeActionExecutionHints(raw: unknown): ActionExecutionHint[] | null {
  if (!Array.isArray(raw)) return null;
  const hints: ActionExecutionHint[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;
    const action = normalizeString(obj.action);
    const hint = normalizeString(obj.execution_hint);
    const effect = normalizeString(obj.expected_effect);
    if (action && hint && effect) {
      hints.push({
        action: truncateToLimit(action, 120),
        execution_hint: truncateToLimit(hint, 200),
        expected_effect: truncateToLimit(effect, 120),
      });
    }
  }
  return hints.length > 0 ? hints.slice(0, 5) : null;
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
    next_trend_plan: normalizeNextTrendPlan(input.next_trend_plan),
    channel_dna_narrative: pickFirstNonEmptyString(input.channel_dna_narrative),
    action_execution_hints: normalizeActionExecutionHints(input.action_execution_hints),
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

  // JSON.parse 실패 방어 — Gemini가 HTML/plain-text 오류 페이지를 반환하면 SyntaxError throw 발생.
  // try/catch 없이 throw되면 callGemini → analyzeChannelWithGemini → route.ts 순으로 전파되어 unhandled 500 발생.
  let parsedBody: unknown = null;
  try {
    parsedBody = rawBody ? (JSON.parse(rawBody) as unknown) : null;
  } catch (parseErr) {
    console.error("[Gemini] response body JSON.parse failed. status:", response.status, "body(first 200):", rawBody.slice(0, 200), "parseErr:", parseErr instanceof Error ? parseErr.message : parseErr);
    return {
      ok: false as const,
      rawText: "",
      rawBody,
      error: `Gemini 응답 파싱 실패 (HTTP ${response.status}): ${rawBody.slice(0, 120)}`,
    };
  }

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

  const tierLabel: Record<string, string> = {
    micro: "Micro (구독자 1,000명 미만)",
    small: "Small (구독자 1,000~10,000명)",
    medium: "Medium (구독자 10,000~100,000명)",
    large: "Large (구독자 100,000명 이상)",
  };

  const channelSizeBlock = [
    `[채널 규모 정보]`,
    `channel_size_tier: ${ctx.channelSizeTier} — ${tierLabel[ctx.channelSizeTier] ?? ctx.channelSizeTier}`,
    `interpretation_mode: ${ctx.interpretationMode}`,
    ``,
    `[분석 해석 가이드]`,
    ...ctx.interpretationHints.map((h) => `- ${h}`),
  ].join("\n");

  const c = ctx.confidence;
  const confidenceLevelKo: Record<string, string> = {
    high: "높음",
    medium: "보통",
    low: "낮음",
  };
  const confidenceBlock = [
    `[분석 신뢰도]`,
    `confidence_score: ${c.confidenceScore}`,
    `confidence_level: ${c.confidenceLevel} (${confidenceLevelKo[c.confidenceLevel] ?? c.confidenceLevel})`,
    ...c.confidenceReasons.map((r) => `- ${r}`),
  ].join("\n");

  return [metricsBlock, "", patternsBlock, "", scoresBlock, "", channelSizeBlock, "", confidenceBlock].join("\n");
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
- next_trend_plan의 topic은 [최근 영상 샘플]에 이미 존재하는 영상과 주제가 중복되지 않아야 합니다. 조회수가 높은 기존 영상을 모방하거나 재현하는 제안은 절대 하지 마세요.
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

[next_trend_plan 작성 규칙]
★ 핵심 제약: 위 [최근 영상 샘플]에 이미 존재하는 영상의 주제를 그대로 반복하거나 매우 유사한 소재를 제안하는 것은 절대 금지. 조회수가 아무리 높은 기존 영상이라도 그 영상을 모방하거나 연장하는 방향은 안 된다. 채널이 아직 만들지 않은 새로운 영역·각도·포맷에서 주제를 선택할 것.
- topic: 채널의 기존 영상과 주제가 겹치지 않으면서 이 채널 시청자층이 관심 가질 만한 미개척 주제를 20자 이내 짧은 구로 작성 (예: "홈카페 레시피", "주식 초보 가이드"). 긴 문장·설명문 절대 금지.
- why_this_topic: 채널 메트릭·패턴 데이터를 인용해 왜 이 주제가 지금 이 채널에 맞는지 2~3문장으로 설명. 기존 영상과 어떻게 다른 방향인지 포함.
- pain_point: 이 영상이 해소할 시청자의 핵심 불편·궁금증을 1~2문장으로
- content_angle: 같은 주제를 다루는 다른 영상과 차별화되는 접근 방식 1문장
- opening_hook: 시청자가 처음 15초 안에 "계속 봐야겠다"고 느낄 오프닝 방향 1문장. 실제 대사체 권장.
- title_candidates: 클릭률을 높일 제목 후보 3개. 각 30자 이내. 번호·기호 없이 제목만.
- recommended_tags: SEO에 적합한 태그 5~8개. 단어 또는 짧은 구.

[channel_dna_narrative 작성 규칙]
- content_patterns, target_audience, strengths를 종합해 채널의 핵심 성격·포지션을 3~4문장으로 자연스럽게 서술
- 번호·기호 목록 절대 금지. 자연스러운 문단 형태
- 메트릭 수치 최소 1개 인용

[action_execution_hints 작성 규칙]
- growth_action_plan의 각 항목에 1:1 대응하는 실행 가이드를 작성
- action: growth_action_plan 항목 원문을 그대로 복사
- execution_hint: 실제로 어떻게 실행할지 1~2문장. "~하세요" 형태의 구체적 행동 지시
- expected_effect: 이 액션 실행 시 기대할 수 있는 효과 1문장. 가능하면 메트릭 예상값 포함
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
