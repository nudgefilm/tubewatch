/**
 * 채널 종합 진단서 원페이퍼 생성 유틸리티
 * - 채널 분석 후 백그라운드(waitUntil)에서 호출 (strategy_plan 이후)
 * - fallback 모델 체인으로 안정성 확보
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const MODELS: Array<{ model: string; generationConfig: Record<string, unknown> }> = [
  { model: "gemini-2.5-flash-lite", generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } },
  { model: "gemini-2.5-flash",      generationConfig: { temperature: 0.7, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } } },
];
const MAX_RETRIES = 2;

const SYSTEM_TEXT =
  "당신은 유튜브 채널 전문 진단 컨설턴트입니다. 마크다운 형식의 채널 종합 진단서를 작성합니다. JSON을 반환하지 않습니다. 인사말·서문·서명(예: '안녕하세요', '드림', '[이름]' 등)은 절대 포함하지 마세요. 바로 본문 내용으로 시작하세요.";

function fmt(n: unknown): string {
  if (n == null) return "N/A";
  return Number(n).toLocaleString("ko-KR");
}

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

export function buildAnalysisReportPrompt(row: Record<string, unknown>): string {
  const title = String(row.channel_title ?? "알 수 없는 채널");

  let rawJson: Record<string, unknown> = {};
  try {
    const raw = row.gemini_raw_json;
    rawJson = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>) ?? {};
  } catch { rawJson = {}; }

  const channelSummary = String(rawJson.channel_summary ?? "");
  const contentPatternSummary = String(rawJson.content_pattern_summary ?? "");
  const strengths = safeArr(rawJson.strengths);
  const weaknesses = safeArr(rawJson.weaknesses);
  const bottlenecks = safeArr(rawJson.bottlenecks);
  const growthActionPlan = safeArr(rawJson.growth_action_plan);
  const analysisConfidence = String(rawJson.analysis_confidence ?? "medium");
  const sampleSizeNote = String(rawJson.sample_size_note ?? "");

  let metricsBlock = "";
  let scoreBlock = "";
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
        `- 분석 영상 수: ${snap?.sampleVideoCount ?? "N/A"}개`,
      ].join("\n");
    }
    const featureScore = row.feature_total_score;
    if (featureScore != null) {
      scoreBlock = `- 채널 종합 점수: ${Number(featureScore).toFixed(1)}점 / 100점`;
    }
  } catch { metricsBlock = ""; }

  return `당신은 10년 경력의 유튜브 채널 전문 진단 컨설턴트입니다.
아래 채널 데이터를 종합해 **채널 종합 진단서**를 작성하세요.

방식: 채널 운영자가 현재 채널의 전반적 상태를 한눈에 파악할 수 있는 진단 문서.
핵심: 지금 이 채널이 어디에 서 있고, 무엇이 성장을 막으며, 무엇부터 해야 하는지.

---

[채널 기본 정보]
채널명: ${title}
채널 요약: ${channelSummary || "정보 없음"}
콘텐츠 패턴 요약: ${contentPatternSummary || "정보 없음"}
분석 신뢰도: ${analysisConfidence}${sampleSizeNote ? ` (${sampleSizeNote})` : ""}

[채널 메트릭]
${metricsBlock || "정보 없음"}
${scoreBlock}

[강점]
${strengths.join(" / ") || "정보 없음"}

[약점]
${weaknesses.join(" / ") || "정보 없음"}

[성장 병목 요인]
${bottlenecks.join(" / ") || "정보 없음"}

[핵심 실행 과제]
${growthActionPlan.map((a, i) => `${i + 1}. ${a}`).join("\n") || "정보 없음"}

---

[작성 가이드]
1. **채널 현재 위치** — 메트릭 수치를 직접 인용해 이 채널이 지금 어느 단계에 있는지 1~2문단으로 진단하세요. 유튜브 채널 성장 단계(초기/성장/안정화) 관점에서 서술.
2. **핵심 강점 3가지** — 데이터가 뒷받침하는 강점을 구체적으로 서술. 각 강점이 채널 성장에 어떤 레버리지를 만드는지 설명.
3. **성장을 막는 병목** — 약점과 병목 요인을 통합해 실제로 채널 성장을 막고 있는 핵심 문제 2~3가지를 진단하세요. 단순 나열이 아니라 인과관계 중심으로.
4. **지금 당장 집중할 1가지** — 위 실행 과제 중 가장 레버리지가 큰 것 1가지를 선택해 왜 이것이 최우선인지, 어떻게 실행해야 하는지 구체적으로 서술.
5. **진단 종합 의견** — 이 채널의 3개월 후 전망을 낙관/중립/신중 중 하나로 제시하고, 그 근거를 데이터에 기반해 1문단으로 서술.

길이 제한 없이 충분히 상세하게 작성하세요.`.trim();
}

/** Gemini 모델 + 재시도 체인으로 마크다운 생성. 전부 실패 시 null 반환. */
export async function callGeminiForAnalysisReport(prompt: string): Promise<string | null> {
  for (const { model, generationConfig } of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
        console.warn(`[analysis-report] fetch error on ${model} attempt ${attempt}:`, e);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      } finally {
        clearTimeout(timeout);
      }

      const data = await res.json();

      if (res.status === 404) {
        console.warn(`[analysis-report] ${model} not found — skipping to next model`);
        break;
      }

      if (!res.ok) {
        console.warn(`[analysis-report] HTTP ${res.status} on ${model} attempt ${attempt}`);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[analysis-report] empty response on ${model} attempt ${attempt}`);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.log(`[analysis-report] success — model: ${model}, attempt: ${attempt}`);
      return text;
    }
  }
  return null;
}
