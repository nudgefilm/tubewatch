/**
 * Channel DNA 진단 리포트 원페이퍼 생성 유틸리티
 * - 채널 분석 후 백그라운드(waitUntil)에서 호출 (strategy_plan 이전)
 * - fallback 모델 체인으로 안정성 확보
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const MODELS: Array<{ model: string; generationConfig: Record<string, unknown> }> = [
  { model: "gemini-2.5-flash-lite", generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } },
  { model: "gemini-2.5-flash",      generationConfig: { temperature: 0.7, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } } },
];
const MAX_RETRIES = 1; // fail-fast: 모델당 1회만 시도, long-tail retry 제거

const SYSTEM_TEXT =
  "당신은 유튜브 채널 DNA 전문 분석가입니다. 마크다운 형식의 채널 DNA 진단 리포트를 작성합니다. JSON을 반환하지 않습니다. 인사말·서문·서명(예: '안녕하세요', '드림', '[이름]' 등)은 절대 포함하지 마세요. 바로 본문 내용으로 시작하세요.";

function fmt(n: unknown): string {
  if (n == null) return "N/A";
  return Number(n).toLocaleString("ko-KR");
}

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

export function buildChannelDnaReportPrompt(row: Record<string, unknown>): string {
  const title = String(row.channel_title ?? "알 수 없는 채널");

  let rawJson: Record<string, unknown> = {};
  try {
    const raw = row.gemini_raw_json;
    rawJson = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>) ?? {};
  } catch { rawJson = {}; }

  const channelDnaNarrative = String(rawJson.channel_dna_narrative ?? "");
  const contentPatterns = safeArr(rawJson.content_patterns);
  const targetAudience = safeArr(rawJson.target_audience);
  const strengths = safeArr(rawJson.strengths);
  const weaknesses = safeArr(rawJson.weaknesses);
  const channelSummary = String(rawJson.channel_summary ?? "");

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

  return `당신은 10년 경력의 유튜브 채널 DNA 전문 분석가입니다.
아래 채널 분석 데이터를 바탕으로 **채널 DNA 진단 리포트**를 작성하세요.

방식: 컨설턴트가 채널 운영자에게 건네는 채널 정체성 진단 문서처럼, 자유로운 서술형 마크다운으로 작성합니다.
핵심: 이 채널이 무엇으로 성장해왔고, 무엇이 발목을 잡는지 명확히 알 수 있을 것.
서식: 각 ## 섹션 제목 앞에 내용에 어울리는 이모지를 하나씩 붙여주세요. (예: ## 🧬 채널 DNA 핵심 정체성)

---

[채널 기본 정보]
채널명: ${title}
채널 요약: ${channelSummary || "정보 없음"}

[채널 DNA 서술]
${channelDnaNarrative || "정보 없음"}

[채널 메트릭]
${metricsBlock || "정보 없음"}

[타겟 시청자]
${targetAudience.join(" / ") || "정보 없음"}

[콘텐츠 패턴]
${contentPatterns.map((p, i) => `${i + 1}. ${p}`).join("\n") || "정보 없음"}

[채널 강점]
${strengths.join(" / ") || "정보 없음"}

[채널 약점]
${weaknesses.join(" / ") || "정보 없음"}

---

[작성 가이드]
1. **채널 DNA 핵심 정체성** — 위 채널 DNA 서술과 콘텐츠 패턴을 종합해, 이 채널이 시청자에게 제공하는 핵심 가치를 1~2문단으로 서술하세요. 메트릭 수치를 인용할 것.
2. **강점 심층 분석** — 데이터가 뒷받침하는 강점을 구체적으로 분석하고, 이를 어떻게 더 강화할 수 있는지 제시하세요.
3. **약점과 개선 방향** — 현재 성장을 저해하는 약점을 짚고, 실질적인 개선 방향을 제시하세요.
4. **타겟 시청자와의 정합성** — 현재 콘텐츠가 타겟 시청자와 얼마나 잘 맞는지 평가하고, 더 깊이 연결되는 방법을 제안하세요.
5. **DNA 강화 포인트** — 이 채널의 정체성을 더 선명하게 만들기 위해 당장 할 수 있는 1~2가지를 구체적으로 제시하세요.

각 섹션은 3~5문장 이내로 간결하게 작성하세요. 전체 분량은 1000자 내외를 목표로 합니다.`.trim();
}

/** Gemini 모델 + 재시도 체인으로 마크다운 생성. 전부 실패 시 null 반환. */
export async function callGeminiForChannelDnaReport(prompt: string): Promise<string | null> {
  for (const { model, generationConfig } of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000); // 25s: 정상 5~15s, 초과 시 장애 판정
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
        console.warn(`[channel-dna-report] fetch error on ${model} attempt ${attempt}:`, e);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      } finally {
        clearTimeout(timeout);
      }

      const data = await res.json();

      if (res.status === 404) {
        console.warn(`[channel-dna-report] ${model} not found — skipping to next model`);
        break;
      }

      if (!res.ok) {
        console.warn(`[channel-dna-report] HTTP ${res.status} on ${model} attempt ${attempt}`);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[channel-dna-report] empty response on ${model} attempt ${attempt}`);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.log(`[channel-dna-report] success — model: ${model}, attempt: ${attempt}`);
      return text;
    }
  }
  return null;
}
