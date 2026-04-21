import type { ActionExecutionHint } from "@/lib/ai/getGeminiConfig";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
// gemini-2.5-flash-lite with thinkingBudget:0 — fast, no reasoning needed for these fields
const MODEL = "gemini-2.5-flash-lite";
const GENERATION_CONFIG = {
  temperature: 0.4,
  maxOutputTokens: 2048,
  thinkingConfig: { thinkingBudget: 0 },
};
const TIMEOUT_MS = 20_000;

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

function parseRawJson(row: Record<string, unknown>): Record<string, unknown> {
  try {
    const raw = row.gemini_raw_json;
    return typeof raw === "string"
      ? (JSON.parse(raw) as Record<string, unknown>)
      : (raw as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

async function callGeminiText(prompt: string, systemText: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemText }] },
          generationConfig: GENERATION_CONFIG,
        }),
      }
    );
  } catch (e) {
    clearTimeout(timeout);
    console.error("[channel-dna-hints] fetch error:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    console.error("[channel-dna-hints] response JSON parse error, status:", res.status);
    return null;
  }

  if (!res.ok) {
    console.error("[channel-dna-hints] HTTP error:", res.status);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.length > 0 ? text : null;
}

// ── channel_dna_narrative ─────────────────────────────────────────────────────

export async function generateChannelDnaNarrative(
  row: Record<string, unknown>
): Promise<string | null> {
  const rawJson = parseRawJson(row);
  const channelTitle = String(row.channel_title ?? "알 수 없는 채널");
  const channelSummary = String(rawJson.channel_summary ?? "");
  const contentPatterns = safeArr(rawJson.content_patterns);
  const targetAudience = safeArr(rawJson.target_audience);
  const strengths = safeArr(rawJson.strengths);

  let metricsLine = "";
  try {
    const snap = row.feature_snapshot as Record<string, unknown> | null;
    const m = snap?.metrics as Record<string, unknown> | null;
    if (m?.avgViewCount != null) {
      metricsLine = `평균 조회수 ${Number(m.avgViewCount).toLocaleString("ko-KR")}회`;
    }
  } catch { /* ignore */ }

  const prompt = `채널 분석 데이터를 바탕으로 이 채널의 핵심 성격과 포지션을 3~4문장으로 서술하세요.

채널명: ${channelTitle}
채널 요약: ${channelSummary || "정보 없음"}
${metricsLine ? `주요 메트릭: ${metricsLine}` : ""}
콘텐츠 패턴: ${contentPatterns.join(" / ") || "정보 없음"}
주요 강점: ${strengths.join(" / ") || "정보 없음"}
타깃 시청자: ${targetAudience.join(" / ") || "정보 없음"}

[작성 규칙]
- content_patterns, target_audience, strengths를 종합해 채널의 핵심 성격·포지션을 자연스럽게 서술
- 번호·기호 목록 절대 금지. 자연스러운 문단 형태
- 메트릭 수치 최소 1개 인용
- 3~4문장, 200자 이내`.trim();

  return callGeminiText(
    prompt,
    "당신은 유튜브 채널 분석 전문가입니다. 마크다운 없이 자연스러운 문단 텍스트만 반환하세요."
  );
}

// ── action_execution_hints ────────────────────────────────────────────────────

const HINTS_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      action: { type: "string" },
      execution_hint: { type: "string" },
      expected_effect: { type: "string" },
    },
    required: ["action", "execution_hint", "expected_effect"],
  },
};

export async function generateActionExecutionHints(
  row: Record<string, unknown>
): Promise<ActionExecutionHint[] | null> {
  const rawJson = parseRawJson(row);
  const growthActionPlan = safeArr(rawJson.growth_action_plan);

  if (growthActionPlan.length === 0) return null;

  const prompt = `아래 성장 액션 플랜 각 항목에 대한 실행 가이드를 JSON 배열로 작성하세요.

[성장 액션 플랜]
${growthActionPlan.map((a, i) => `${i + 1}. ${a}`).join("\n")}

[작성 규칙]
- action: 위 항목 원문을 그대로 복사
- execution_hint: 실제로 어떻게 실행할지 1~2문장. "~하세요" 형태의 구체적 행동 지시
- expected_effect: 이 액션 실행 시 기대할 수 있는 효과 1문장. 가능하면 메트릭 예상값 포함`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{ text: "당신은 유튜브 채널 성장 컨설턴트입니다. 반드시 JSON 배열만 반환하세요." }],
          },
          generationConfig: {
            ...GENERATION_CONFIG,
            responseMimeType: "application/json",
            responseSchema: HINTS_SCHEMA,
          },
        }),
      }
    );
  } catch (e) {
    clearTimeout(timeout);
    console.error("[action-hints] fetch error:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    console.error("[action-hints] response JSON parse error, status:", res.status);
    return null;
  }

  if (!res.ok) {
    console.error("[action-hints] HTTP error:", res.status);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") return null;

  try {
    const parsed = JSON.parse(text) as ActionExecutionHint[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    console.error("[action-hints] JSON parse error:", e);
    return null;
  }
}
