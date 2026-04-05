/**
 * 성장 전략 실행 플랜 원페이퍼 생성 유틸리티
 * - 채널 분석 후 백그라운드(waitUntil)에서 호출
 * - fallback 모델 체인으로 안정성 확보
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const MODELS: Array<{ model: string; generationConfig: Record<string, unknown> }> = [
  { model: "gemini-2.5-flash-lite",  generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } },
  { model: "gemini-2.5-flash",        generationConfig: { temperature: 0.7, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } } },
  { model: "gemini-1.5-flash-latest", generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } },
];

const SYSTEM_TEXT =
  "당신은 유튜브 채널 성장 전략가입니다. 마크다운 형식의 원페이퍼 전략 문서를 작성합니다. JSON을 반환하지 않습니다. 인사말·서문·서명(예: '안녕하세요', '드림', '[이름]' 등)은 절대 포함하지 마세요. 바로 본문 내용으로 시작하세요.";

function fmt(n: unknown): string {
  if (n == null) return "N/A";
  return Number(n).toLocaleString("ko-KR");
}

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

export function buildStrategyPlanPrompt(row: Record<string, unknown>): string {
  const title = String(row.channel_title ?? "알 수 없는 채널");

  let rawJson: Record<string, unknown> = {};
  try {
    const raw = row.gemini_raw_json;
    rawJson = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>) ?? {};
  } catch { rawJson = {}; }

  const actionPlan = safeArr(rawJson.growth_action_plan);
  const strengths = safeArr(rawJson.strengths);
  const weaknesses = safeArr(rawJson.weaknesses);
  const bottlenecks = safeArr(rawJson.bottlenecks);
  const channelSummary = String(rawJson.channel_summary ?? "");

  const hints = Array.isArray(rawJson.action_execution_hints)
    ? (rawJson.action_execution_hints as Array<Record<string, string>>)
        .map((h) => `- ${h.action ?? ""}\n  → ${h.execution_hint ?? ""} (기대 효과: ${h.expected_effect ?? ""})`)
        .join("\n")
    : "";

  let metricsBlock = "";
  try {
    const snap = row.feature_snapshot as Record<string, unknown> | null;
    const metrics = snap?.metrics as Record<string, unknown> | null;
    if (metrics) {
      metricsBlock = [
        `- 평균 조회수: ${fmt(metrics.avgViewCount)}`,
        `- 중앙값 조회수: ${fmt(metrics.medianViewCount)}`,
        `- 평균 좋아요 비율: ${metrics.avgLikeRatio != null ? (Number(metrics.avgLikeRatio) * 100).toFixed(2) + "%" : "N/A"}`,
        `- 평균 댓글 비율: ${metrics.avgCommentRatio != null ? (Number(metrics.avgCommentRatio) * 100).toFixed(2) + "%" : "N/A"}`,
        `- 평균 업로드 간격: ${metrics.avgUploadIntervalDays != null ? Number(metrics.avgUploadIntervalDays).toFixed(1) + "일" : "N/A"}`,
        `- 최근 30일 업로드: ${metrics.recent30dUploadCount ?? "N/A"}개`,
      ].join("\n");
    }
  } catch { metricsBlock = ""; }

  return `당신은 10년 경력의 유튜브 채널 성장 전략가입니다.
아래 채널 분석 데이터를 바탕으로 **성장 전략 실행 플랜 원페이퍼(One-Pager)**를 작성하세요.

방식: 컨설턴트가 채널 운영자에게 건네는 실전 전략 문서처럼, 자유로운 서술형 마크다운으로 작성합니다.
핵심: 읽고 나서 내일 당장 무엇을 해야 할지 명확히 알 수 있을 것.

---

[채널 기본 정보]
채널명: ${title}
채널 요약: ${channelSummary || "정보 없음"}

[채널 메트릭]
${metricsBlock || "정보 없음"}

[채널 강점]
${strengths.join(" / ") || "정보 없음"}

[채널 약점]
${weaknesses.join(" / ") || "정보 없음"}

[병목 요인]
${bottlenecks.join(" / ") || "정보 없음"}

[AI 생성 실행 계획 (우선순위순)]
${actionPlan.map((a, i) => `${i + 1}. ${a}`).join("\n") || "정보 없음"}

[실행 힌트]
${hints || "정보 없음"}

---

[작성 가이드]
1. **채널 현황 진단** — 위 메트릭과 강약점 수치를 직접 인용해 지금 이 채널의 핵심 문제를 1~2문단으로 짚어주세요.
2. **지금 당장 해야 할 것 (이번 주)** — 위 실행 계획 중 가장 임팩트가 큰 2~3개를 골라 구체적 행동 지시로 서술하세요.
3. **30일 로드맵** — 주차별(1주차/2주차/3~4주차)로 실행 순서와 핵심 체크포인트를 제시하세요.
4. **성공 기준** — 30일 후 어떤 수치가 어떻게 바뀌면 전략이 작동한 것인지 구체적으로 명시하세요.
5. **주의할 함정** — 이 채널이 빠지기 쉬운 실수나 리스크를 1~2가지 짚어주세요.

길이 제한 없이 충분히 상세하게 작성하세요.`.trim();
}

/** Gemini fallback 체인으로 마크다운 생성. 실패 시 null 반환. */
export async function callGeminiForStrategyPlan(prompt: string): Promise<string | null> {
  for (const { model, generationConfig } of MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            systemInstruction: { parts: [{ text: SYSTEM_TEXT }] },
          }),
        }
      );
    } catch (e) {
      clearTimeout(timeout);
      console.warn(`[strategy-plan] fetch error on ${model}:`, e);
      continue;
    } finally {
      clearTimeout(timeout);
    }

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[strategy-plan] HTTP ${res.status} on ${model} — trying next`);
      continue;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn(`[strategy-plan] empty response on ${model} — trying next`);
      continue;
    }
    console.log(`[strategy-plan] success with model: ${model}`);
    return text;
  }
  return null;
}
