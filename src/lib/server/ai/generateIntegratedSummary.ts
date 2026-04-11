/**
 * 채널 통합 요약 생성 유틸리티
 * - 온디맨드(버튼 클릭 시)로만 호출됨 — 불필요한 API 비용 방지
 * - 4-Matrix 분석 로직(성과-잠재력 / 콘텐츠 구조 / 타겟 정합성 / 리스크 헤지) 내장
 * - 기존 Gemini fallback 체인 패턴 동일 적용
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const MODELS: Array<{ model: string; generationConfig: Record<string, unknown> }> = [
  { model: "gemini-2.5-flash-lite", generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } },
  { model: "gemini-2.5-flash",      generationConfig: { temperature: 0.7, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } } },
];
const MAX_RETRIES = 2;

const SYSTEM_TEXT =
  "당신은 유튜브 채널 전문 성장 전략가 'TubeWatch AI'입니다. " +
  "채널 분석 데이터를 기반으로 즉시 실행 가능한 성장 통합 요약을 제공합니다. " +
  "인사말·서문·마무리 인사(예: '안녕하세요', '드림', '[이름]')는 절대 포함하지 마세요. " +
  "JSON을 반환하지 않습니다. 반드시 한국어로 작성하며 본문으로 바로 시작하세요.";

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function fmt(n: unknown): string {
  if (n == null) return "N/A";
  const num = Number(n);
  return isNaN(num) ? "N/A" : num.toLocaleString("ko-KR");
}

function safeArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

/**
 * 성과-잠재력 매트릭스 유형 결정.
 * seoOptimization → 잠재력 지표
 * audienceResponse → 전환 성과 지표
 * 기준점: 60점 (100점 만점 기준 중상위)
 */
function getMatrixType(seoScore: number, audienceScore: number): string {
  const highSeo      = seoScore >= 60;
  const highAudience = audienceScore >= 60;
  if ( highSeo && !highAudience) return "효율 개선형 (SEO 잠재력↑, 전환 성과↓)";
  if (!highSeo &&  highAudience) return "확장 시급형 (팬덤↑, 노출 전략↓)";
  if ( highSeo &&  highAudience) return "성장 가속형 (잠재력↑, 성과↑ — 규모 확장 시점)";
  return "구조 재건형 (잠재력↓, 성과↓ — 기획 단계부터 재설계 필요)";
}

// ─── 프롬프트 빌더 ────────────────────────────────────────────────────────────

export function buildIntegratedSummaryPrompt(row: Record<string, unknown>): string {
  const title = String(row.channel_title ?? "알 수 없는 채널");

  // gemini_raw_json 파싱 (TEXT 컬럼이므로 직접 JSON.parse)
  let raw: Record<string, unknown> = {};
  try {
    const r = row.gemini_raw_json;
    raw = typeof r === "string" ? JSON.parse(r) : ((r as Record<string, unknown>) ?? {});
  } catch {
    raw = {};
  }

  const channelSummary       = String(raw.channel_summary        ?? "정보 없음");
  const contentPatternSum    = String(raw.content_pattern_summary ?? "정보 없음");
  const strengths            = safeArr(raw.strengths);
  const weaknesses           = safeArr(raw.weaknesses);
  const bottlenecks          = safeArr(raw.bottlenecks);
  const growthActionPlan     = safeArr(raw.growth_action_plan);
  const targetAudience       = safeArr(raw.target_audience);
  const recommendedTopics    = safeArr(raw.recommended_topics);
  const contentPatterns      = safeArr(raw.content_patterns);
  const analysisConfidence   = String(raw.analysis_confidence ?? "medium");

  // 섹션 점수 파싱 (JSONB — Supabase가 객체로 반환)
  const sec = (row.feature_section_scores ?? {}) as Record<string, unknown>;
  const seoScore              = safeNum(sec.seoOptimization);
  const audienceScore         = safeNum(sec.audienceResponse);
  const contentStructureScore = safeNum(sec.contentStructure);
  const growthMomentumScore   = safeNum(sec.growthMomentum);
  const subscriptionScore     = safeNum(sec.subscriptionConversion);
  const totalScore            = safeNum(row.feature_total_score);

  // 메트릭 파싱 (JSONB)
  const snap    = (row.feature_snapshot ?? {}) as Record<string, unknown>;
  const metrics = (snap.metrics          ?? {}) as Record<string, unknown>;

  const avgCommentRatioPct = metrics.avgCommentRatio != null
    ? (safeNum(metrics.avgCommentRatio) * 100).toFixed(2) + "%"
    : "N/A";
  const avgLikeRatioPct = metrics.avgLikeRatio != null
    ? (safeNum(metrics.avgLikeRatio) * 100).toFixed(2) + "%"
    : "N/A";
  const uploadInterval = metrics.avgUploadIntervalDays != null
    ? safeNum(metrics.avgUploadIntervalDays).toFixed(1) + "일"
    : "N/A";
  const isIrregularUpload =
    metrics.avgUploadIntervalDays != null &&
    safeNum(metrics.avgUploadIntervalDays) > 10;

  // ① 성과-잠재력 매트릭스
  const matrixType = getMatrixType(seoScore, audienceScore);

  // ② 콘텐츠 구조 진단
  const structureDiagnosis =
    contentStructureScore < 60
      ? "'기획 단계 문제'로 진단하세요."
      : audienceScore < 60
        ? "구조는 양호하나 참여도가 낮습니다 — '편집/템포 문제'로 구분하세요."
        : "구조와 참여도 모두 양호합니다 — 현재 공식 강화에 집중하세요.";

  // ③ 타겟 정합성 힌트
  const targetHint =
    targetAudience.length > 0 && recommendedTopics.length > 0
      ? `타겟(${targetAudience.slice(0, 2).join(", ")})과 추천 주제(${recommendedTopics.slice(0, 2).join(", ")})의 일치도를 판단해 '딥다이브 전략' 또는 '채널 스펙트럼 확장 전략'으로 반영하세요.`
      : "타겟 시청자 또는 추천 주제 데이터가 부족합니다. 채널 DNA 기반으로 판단하세요.";

  // ④ 리스크 헤지 힌트
  const riskHint = isIrregularUpload
    ? `업로드 주기가 ${uploadInterval}로 불규칙합니다. '지속 가능한 루틴 형성'을 치트키 Action에 반드시 포함하세요.`
    : "업로드 주기는 안정적입니다. 콘텐츠 품질 강화에 집중하세요.";

  return `아래 채널 분석 데이터를 기반으로 **채널 성장 통합 요약**을 작성하세요.

[채널 정보]
채널명: ${title}
채널 요약: ${channelSummary}
콘텐츠 패턴: ${contentPatternSum}
타겟 시청자: ${targetAudience.join(", ") || "정보 없음"}
추천 주제: ${recommendedTopics.join(", ") || "정보 없음"}
콘텐츠 패턴 키워드: ${contentPatterns.join(", ") || "정보 없음"}
분석 신뢰도: ${analysisConfidence}

[핵심 점수 (100점 만점)]
- 종합 점수: ${totalScore.toFixed(1)}점
- SEO 최적화: ${seoScore.toFixed(1)}점  ← 잠재력 지표
- 시청자 반응: ${audienceScore.toFixed(1)}점  ← 전환 성과 지표
- 콘텐츠 구조: ${contentStructureScore.toFixed(1)}점
- 성장 모멘텀: ${growthMomentumScore.toFixed(1)}점
- 구독 전환율: ${subscriptionScore.toFixed(1)}점

[주요 메트릭]
- 평균 조회수: ${fmt(metrics.avgViewCount)}
- 중앙값 조회수: ${fmt(metrics.medianViewCount)}
- 평균 댓글 비율: ${avgCommentRatioPct}
- 평균 좋아요 비율: ${avgLikeRatioPct}
- 업로드 주기: ${uploadInterval}${isIrregularUpload ? " ⚠ 불규칙" : ""}
- 분석 영상 수: ${fmt(snap.sampleVideoCount)}개

[강점]
${strengths.length ? strengths.map((s, i) => `${i + 1}. ${s}`).join("\n") : "정보 없음"}

[약점]
${weaknesses.length ? weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n") : "정보 없음"}

[성장 병목 요인]
${bottlenecks.length ? bottlenecks.map((b, i) => `${i + 1}. ${b}`).join("\n") : "정보 없음"}

[핵심 실행 과제]
${growthActionPlan.length ? growthActionPlan.map((a, i) => `${i + 1}. ${a}`).join("\n") : "정보 없음"}

---

[4-Matrix 분석 지침 — 반드시 적용하세요]
① 성과-잠재력: 현재 채널 유형은 "${matrixType}"입니다. **현황** 섹션에 이 유형명을 명시하고, SEO ${seoScore.toFixed(0)}점 / 시청자반응 ${audienceScore.toFixed(0)}점 수치를 인용하세요.
② 콘텐츠 구조: ${structureDiagnosis}
③ 타겟 정합성: ${targetHint}
④ 리스크 헤지: ${riskHint}

---

[출력 규칙 — 엄수]
- 반드시 아래 5개 섹션만 작성하세요. 섹션 사이 빈 줄 1개.
- 각 섹션 1~2문장. 총 출력 10줄 이내.
- 마크다운 볼드(**섹션명:**) 형식만 사용. 헤딩(#, ##) 절대 금지.
- 수치는 반드시 직접 인용하세요 (예: "댓글 비율 ${avgCommentRatioPct}").
- 근거 없는 낙관적 표현 금지. 데이터 기반 현실적 예측만 작성합니다.

**현황:** [채널 유형 + 현재 핵심 상태 1~2문장]

**핵심 원인:** [가장 시급한 병목 요인 구체적 진단 1~2문장]

**전략적 타겟:** [가장 효과적인 타겟 + 방향 1문장]

**치트키 Action:** [내일 당장 실행 가능한 임팩트 높은 액션 1~2가지]

**성장 예측:** [30일 이내 예상 변화, 수치 포함 1문장]`.trim();
}

// ─── Gemini 호출 ──────────────────────────────────────────────────────────────

/** fallback 모델 체인으로 통합 요약 생성. 전부 실패 시 null 반환. */
export async function callGeminiForIntegratedSummary(prompt: string): Promise<string | null> {
  for (const { model, generationConfig } of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40_000);
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
        console.warn(`[integrated-summary] fetch error — ${model} attempt ${attempt}:`, e);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      } finally {
        clearTimeout(timeout);
      }

      const data = (await res.json()) as Record<string, unknown>;

      if (res.status === 404) {
        console.warn(`[integrated-summary] ${model} not found — skipping to next model`);
        break;
      }
      if (!res.ok) {
        console.warn(`[integrated-summary] HTTP ${res.status} — ${model} attempt ${attempt}`);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      const candidates = data?.candidates as Array<Record<string, unknown>> | undefined;
      const text = candidates?.[0]?.content
        ? ((candidates[0].content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>)?.[0]?.text
        : undefined;

      if (typeof text !== "string" || !text.trim()) {
        console.warn(`[integrated-summary] empty response — ${model} attempt ${attempt}`);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.log(`[integrated-summary] success — model: ${model}, attempt: ${attempt}`);
      return text;
    }
  }
  return null;
}
