import { NEXT_TREND_PLAN_SCHEMA, type NextTrendAIPlan } from "@/lib/ai/getGeminiConfig";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 100_000;

const SYSTEM_TEXT =
  "당신은 시청률에 미친 방송 작가입니다. 채널 데이터를 바탕으로 다음 영상 기획안을 작성합니다. 반드시 JSON만 반환하세요.";

type VideoItem = {
  videoId?: string;
  title?: string;
  publishedAt?: string | null;
  viewCount?: number | null;
};

function selectVideoSample(videos: VideoItem[]): VideoItem[] {
  const byViews = [...videos]
    .filter((v) => typeof v.viewCount === "number" && v.viewCount > 0)
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 5);
  const byDate = [...videos]
    .filter((v) => v.publishedAt != null)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 10);
  const seen = new Set<string>();
  const result: VideoItem[] = [];
  for (const v of [...byViews, ...byDate]) {
    const key = v.videoId ?? v.title ?? "";
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(v);
    }
  }
  return result;
}

function fmt(n: unknown): string {
  if (n == null) return "N/A";
  return Number(n).toLocaleString("ko-KR");
}

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

export function buildNextTrendPlanPrompt(row: Record<string, unknown>): string {
  const channelTitle = String(row.channel_title ?? "알 수 없는 채널");

  let rawJson: Record<string, unknown> = {};
  try {
    const raw = row.gemini_raw_json;
    rawJson = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>) ?? {};
  } catch { rawJson = {}; }

  const channelSummary = String(rawJson.channel_summary ?? "");
  const contentPatterns = safeArr(rawJson.content_patterns);
  const strengths = safeArr(rawJson.strengths);
  const weaknesses = safeArr(rawJson.weaknesses);
  const growthActionPlan = safeArr(rawJson.growth_action_plan);
  const recommendedTopics = safeArr(rawJson.recommended_topics);

  let videos: VideoItem[] = [];
  let metricsBlock = "";
  try {
    const snap = row.feature_snapshot as Record<string, unknown> | null;
    if (Array.isArray(snap?.videos)) videos = snap!.videos as VideoItem[];
    const metrics = snap?.metrics as Record<string, unknown> | null;
    if (metrics) {
      metricsBlock = [
        `- 평균 조회수: ${fmt(metrics.avgViewCount)}`,
        `- 중앙값 조회수: ${fmt(metrics.medianViewCount)}`,
        `- 평균 좋아요 비율: ${metrics.avgLikeRatio != null ? (Number(metrics.avgLikeRatio) * 100).toFixed(2) + "%" : "N/A"}`,
        `- 평균 업로드 간격: ${metrics.avgUploadIntervalDays != null ? Number(metrics.avgUploadIntervalDays).toFixed(1) + "일" : "N/A"}`,
        `- 최근 30일 업로드: ${metrics.recent30dUploadCount ?? "N/A"}개`,
      ].join("\n");
    }
  } catch { /* ignore */ }

  const sampled = selectVideoSample(videos);

  const top3 = [...videos]
    .filter((v) => typeof v.viewCount === "number" && v.viewCount > 0)
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 3);

  const top3Block = top3.length > 0
    ? `[최고 성과 영상 레퍼런스 — 제목 스타일·언어 감각 반드시 참고]\n` +
      top3.map((v, i) => `TOP${i + 1}. "${v.title ?? ""}" — 조회수 ${fmt(v.viewCount)}`).join("\n")
    : "";

  const videoSampleBlock = sampled.length > 0
    ? `[영상 샘플 — ${sampled.length}개 (조회수 상위+최신 선별)]\n` +
      sampled.map((v, i) => [
        `${i + 1}. title: ${v.title ?? "unknown"}`,
        `published_at: ${v.publishedAt ?? "unknown"}`,
        `views: ${fmt(v.viewCount)}`,
      ].join("\n")).join("\n\n")
    : "";

  return `당신은 시청률에 미친 방송 작가입니다. 채널 분석 데이터를 바탕으로 다음 영상 기획안을 작성하세요.
출력은 반드시 JSON만 반환하세요.

[채널 정보]
채널명: ${channelTitle}

[채널 메트릭]
${metricsBlock || "정보 없음"}

[기본 분석 요약]
채널 요약: ${channelSummary || "정보 없음"}
콘텐츠 패턴: ${contentPatterns.join(" / ") || "정보 없음"}
강점: ${strengths.join(" / ") || "정보 없음"}
약점: ${weaknesses.join(" / ") || "정보 없음"}
성장 액션: ${growthActionPlan.map((a, i) => `${i + 1}. ${a}`).join("\n") || "정보 없음"}
추천 주제: ${recommendedTopics.join(" / ") || "정보 없음"}

${top3Block}

${videoSampleBlock}

[작성 규칙]
★ 주제 제약: 위 [영상 샘플]에 이미 존재하는 영상의 주제를 반복하거나 모방하는 것 절대 금지. 채널이 아직 만들지 않은 새로운 영역·각도·포맷에서 주제를 선택할 것.
★ 제목·언어 기준: 위 [최고 성과 영상 레퍼런스]의 제목 구조와 어휘 감각을 반드시 참고할 것. 제목에 원시 수치 그대로 쓰지 말고 '현지인만 아는', '아무도 모르는', '한 번도 공개 안 된', '이것만 알면' 같은 희소성·감성 키워드로 번역할 것.

- topic: 채널이 아직 다루지 않은 미개척 주제. 20자 이내 짧은 구. 긴 문장 절대 금지.
- why_this_topic: 채널 메트릭·패턴 데이터 인용, 기존 영상과 다른 방향 포함, 2~3문장.
- pain_point: 이 영상이 해소할 시청자 핵심 불편·궁금증 1~2문장.
- content_angle: 경쟁 채널 대비 차별화 접근 1문장.
- opening_hook: 처음 15초 안에 시청자를 잡을 실제 대사체. 숫자 대신 감정·궁금증 유발. 예: "저도 처음엔 몰랐는데…"
- title_candidates: 제목 후보 3개. 각 30자 이내. 레퍼런스 언어 감각 참고. 원시 수치 절대 금지. 번호·기호 없이 제목만.
- recommended_tags: SEO 태그 5~8개.
- viewing_points: 5개 지표 1~5 정수. 모두 3점 동일 금지.
- vpd_sec1: ## 1. 기획 의도 — 채널 메트릭·수치 인용. 2~3문단. 빈 문자열 금지.
- vpd_sec2: ## 2. 킬러 타이틀 & 썸네일 — 제목 3개(유형 레이블 포함) + 썸네일 전략. 빈 문자열 금지.
- vpd_sec3: ## 3. 인트로 30초 설계 — 타임스탬프별 장면·대사. 빈 문자열 금지.
- vpd_sec4: ## 4. 메인 콘텐츠 구성 — Chapter 2~3개. 빈 문자열 금지.
- vpd_sec5: ## 5. 시청자 결핍 & SEO — 니즈 서술 + #태그. 빈 문자열 금지.
- vpd_sec6: ## 6. 예상 시청자 반응 — 예상 댓글 2개·조회수 범위·48h 체크포인트. 빈 문자열 금지.
- execution_hint_document: 제목·훅·썸네일 원페이퍼. 3섹션(## 제목 후보 / ## 훅 설계 / ## 썸네일 방향). 300자 내외. 빈 문자열 금지.`.trim();
}

async function callGeminiOnce(prompt: string, signal: AbortSignal, model: string): Promise<NextTrendAIPlan> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_TEXT }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: NEXT_TREND_PLAN_SCHEMA,
        },
      }),
    }
  );

  let data: unknown;
  try { data = await res.json(); } catch {
    throw new Error(`response parse error, status: ${res.status}`);
  }

  if (!res.ok) {
    const errDetail = JSON.stringify((data as any)?.error ?? data);
    const err = new Error(`Gemini HTTP ${res.status}: ${errDetail}`);
    (err as any).status = res.status;
    throw err;
  }

  const parts: unknown[] = (data as any)?.candidates?.[0]?.content?.parts ?? [];
  const text = (parts[parts.length - 1] as any)?.text;
  if (!text || typeof text !== "string") {
    throw new Error(`Gemini empty response: ${JSON.stringify((data as any)?.candidates?.[0]).slice(0, 300)}`);
  }

  try {
    return JSON.parse(text) as NextTrendAIPlan;
  } catch {
    throw new Error(`JSON parse error: ${text.slice(0, 200)}`);
  }
}

export async function generateNextTrendPlan(
  row: Record<string, unknown>
): Promise<NextTrendAIPlan | null> {
  const prompt = buildNextTrendPlanPrompt(row);
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const result = await callGeminiOnce(prompt, controller.signal, MODEL);
      clearTimeout(timeout);
      return result;
    } catch (e) {
      clearTimeout(timeout);
      const status = (e as any)?.status as number | undefined;
      console.error(`[next-trend-plan] attempt ${attempt}:`, e instanceof Error ? e.message : e);
      if (status !== 503 && status !== 429) throw e;
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  const err = new Error("GEMINI_OVERLOADED");
  (err as any).overloaded = true;
  throw err;
}
