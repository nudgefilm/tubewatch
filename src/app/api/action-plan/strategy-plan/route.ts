import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function fmt(n: unknown): string {
  if (n == null) return "N/A";
  return Number(n).toLocaleString("ko-KR");
}

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

function buildPrompt(row: Record<string, unknown>): string {
  const title = String(row.channel_title ?? "알 수 없는 채널");

  // gemini_raw_json 파싱
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

  // 힌트 (action_execution_hints)
  const hints = Array.isArray(rawJson.action_execution_hints)
    ? (rawJson.action_execution_hints as Array<Record<string, string>>)
        .map((h) => `- ${h.action ?? ""}\n  → ${h.execution_hint ?? ""} (기대 효과: ${h.expected_effect ?? ""})`)
        .join("\n")
    : "";

  // feature_snapshot 메트릭
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

export async function POST(req: NextRequest) {
  try {
    const { channelId } = await req.json();
    if (!channelId) {
      return NextResponse.json({ error: "channelId required" }, { status: 400 });
    }

    // 인증
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 최신 분석 결과 조회
    const { data: rows, error } = await supabase
      .from("analysis_results")
      .select("channel_title, gemini_raw_json, feature_snapshot, created_at")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ error: "분석 데이터가 없습니다." }, { status: 404 });
    }

    // 쿨다운 체크 — 마지막 분석 후 72시간 이내 차단
    const lastCreatedAt: string | null = (rows[0] as Record<string, unknown>).created_at as string | null;
    if (lastCreatedAt) {
      const diffHours = (Date.now() - new Date(lastCreatedAt).getTime()) / (1000 * 60 * 60);
      if (diffHours < 72) {
        const remainHours = Math.ceil(72 - diffHours);
        return NextResponse.json(
          { error: `마지막 분석 후 72시간 이내에는 생성할 수 없습니다. 약 ${remainHours}시간 후 다시 시도해주세요.`, code: "COOLDOWN_ACTIVE" },
          { status: 429 }
        );
      }
    }

    const prompt = buildPrompt(rows[0] as Record<string, unknown>);

    // Gemini 호출
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          systemInstruction: {
            parts: [{
              text: "당신은 유튜브 채널 성장 전략가입니다. 마크다운 형식의 원페이퍼 전략 문서를 작성합니다. JSON을 반환하지 않습니다.",
            }],
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const markdown = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!markdown) {
      return NextResponse.json({ error: "Gemini 응답 오류" }, { status: 500 });
    }

    return NextResponse.json({ markdown });
  } catch (e) {
    console.error("[strategy-plan]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
