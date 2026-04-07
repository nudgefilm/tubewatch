/**
 * gen-onepager.mjs
 * DB에서 최신 분석 데이터를 꺼내 Gemini에게 원페이퍼 영상 기획안을 요청하고
 * 결과를 터미널(마크다운)로 출력합니다.
 *
 * 실행: node scripts/gen-onepager.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

function fmt(n) {
  if (n == null || n === undefined) return "N/A";
  return Number(n).toLocaleString("ko-KR");
}

function get(v, ...keys) {
  for (const k of keys) {
    if (v && v[k] !== undefined && v[k] !== null) return v[k];
  }
  return null;
}

// ── 1. DB에서 최신 분석 결과 조회
async function fetchLatestAnalysis() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/analysis_results`);
  url.searchParams.set(
    "select",
    "id,channel_id,channel_title,raw_channel_payload,feature_snapshot,content_patterns,strengths,weaknesses,analysis_confidence,feature_section_scores,feature_total_score,created_at"
  );
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    console.error("DB 응답:", JSON.stringify(data, null, 2));
    throw new Error("분석 결과가 없습니다.");
  }
  return data[0];
}

// ── 2. 영상 목록 추출
function extractVideos(featureSnapshot) {
  if (!featureSnapshot) return [];
  const vids = featureSnapshot.videos ?? [];
  return Array.isArray(vids) ? vids.slice(0, 30) : [];
}

// ── 구독자 수 추출
function extractSubscriberCount(rawChannelPayload) {
  if (!rawChannelPayload) return null;
  return (
    rawChannelPayload.subscriberCount ??
    rawChannelPayload.subscriber_count ??
    rawChannelPayload?.statistics?.subscriberCount ??
    null
  );
}

// ── 3. TOP3 성과 영상
function extractTop3(videos) {
  return [...videos]
    .sort((a, b) => {
      const bv = get(b, "viewCount", "view_count") ?? 0;
      const av = get(a, "viewCount", "view_count") ?? 0;
      return bv - av;
    })
    .slice(0, 3);
}

// ── 4. 원페이퍼 프롬프트
function buildOnePagerPrompt(row, videos, top3) {
  const channelTitle = row.channel_title ?? "알 수 없는 채널";
  const subscriberCount = fmt(extractSubscriberCount(row.raw_channel_payload));
  const confidence = row.analysis_confidence ?? "unknown";

  // 메트릭 정보
  const metrics = row.feature_snapshot?.metrics ?? {};
  const metricsBlock = Object.keys(metrics).length > 0
    ? `[채널 메트릭]\n` +
      `- 평균 조회수: ${fmt(metrics.avgViewCount)}\n` +
      `- 중앙값 조회수: ${fmt(metrics.medianViewCount)}\n` +
      `- 평균 좋아요 비율: ${metrics.avgLikeRatio != null ? (metrics.avgLikeRatio * 100).toFixed(2) + "%" : "N/A"}\n` +
      `- 평균 댓글 비율: ${metrics.avgCommentRatio != null ? (metrics.avgCommentRatio * 100).toFixed(2) + "%" : "N/A"}\n` +
      `- 평균 영상 길이: ${metrics.avgVideoDuration != null ? Math.round(metrics.avgVideoDuration / 60) + "분" : "N/A"}\n` +
      `- 평균 업로드 간격: ${metrics.avgUploadIntervalDays != null ? metrics.avgUploadIntervalDays.toFixed(1) + "일" : "N/A"}\n` +
      `- 최근 30일 업로드: ${metrics.recent30dUploadCount ?? "N/A"}개\n` +
      `- 평균 태그 수: ${metrics.avgTagCount ?? "N/A"}개`
    : "";
  const strengths = (row.strengths ?? []).join(" / ") || "정보 없음";
  const weaknesses = (row.weaknesses ?? []).join(" / ") || "정보 없음";
  const patterns = (row.content_patterns ?? []).join(" / ") || "정보 없음";

  const videoLines = videos
    .slice(0, 20)
    .map((v, i) => {
      const title = get(v, "title") ?? "제목 없음";
      const date = get(v, "publishedAt", "published_at") ?? "-";
      const views = fmt(get(v, "viewCount", "view_count"));
      const likes = fmt(get(v, "likeCount", "like_count"));
      const comments = fmt(get(v, "commentCount", "comment_count"));
      const duration = get(v, "duration") ?? "-";
      return `${i + 1}. "${title}"\n   날짜: ${date} | 조회수: ${views} | 좋아요: ${likes} | 댓글: ${comments} | 길이: ${duration}`;
    })
    .join("\n\n");

  const top3Lines = top3
    .map((v, i) => {
      const title = get(v, "title") ?? "제목 없음";
      const views = fmt(get(v, "viewCount", "view_count"));
      return `TOP${i + 1}. "${title}" — 조회수 ${views}`;
    })
    .join("\n");

  return `당신은 10년 경력의 유튜브 방송 작가입니다.
아래 채널 데이터를 바탕으로 **다음에 만들 영상의 원페이퍼(One-Pager) 기획안**을 작성하세요.

형식 제약 없이, 방송 작가가 PD에게 건네는 실제 기획안처럼 자유롭게 서술형 마크다운으로 작성합니다.
구조화된 JSON이나 고정 섹션 템플릿을 따르지 않아도 됩니다.
핵심은 **읽으면 바로 촬영에 들어갈 수 있을 정도의 구체성**입니다.

---

[채널 기본 정보]
- 채널명: ${channelTitle}
- 구독자: ${subscriberCount}명
- 분석 신뢰도: ${confidence}

${metricsBlock}

[채널 강점]
${strengths}

[채널 약점]
${weaknesses}

[콘텐츠 패턴]
${patterns}

[최고 성과 영상 TOP3 — 제목 스타일·언어 감각 반드시 참고]
${top3Lines || "정보 없음"}

[최근 영상 샘플 (최대 20개)]
${videoLines || "영상 데이터 없음"}

---

[기획안 작성 가이드]
1. 위 샘플 영상 중 아직 다루지 않은 새로운 주제·각도를 선택하세요.
2. 기획 의도 — 왜 지금 이 채널에 이 주제인지, 위 메트릭 수치를 직접 인용해 설명하세요.
3. 영상 제목 후보 3개 — TOP3 영상의 언어 감각을 살려, 원시 수치(조회수·배수) 대신 감성·희소성 키워드로 표현하세요.
4. 썸네일 전략 — 색상, 텍스트 배치, 얼굴/사물 구도를 구체적으로 지시하세요.
5. 오프닝 30초 설계 — 00:00~00:10 / 00:10~00:30 타임스탬프별 장면·대사를 실제로 써 주세요.
6. 본편 구성 — 챕터 2~3개, 소제목과 핵심 내용 한 단락씩.
7. SEO 태그 — 핵심 키워드 5~8개, #태그 형식.
8. 예상 시청자 반응 — 실제 댓글 형태 2개 + 48시간 조회수 예상 범위.

길이 제한 없이 충분히 상세하게 작성하세요.`.trim();
}

// ── 5. Gemini 호출
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
    systemInstruction: {
      parts: [
        {
          text: "당신은 10년 경력의 유튜브 방송 작가입니다. 마크다운 형식으로 자유롭게 원페이퍼 영상 기획안을 작성합니다. JSON을 절대 반환하지 않습니다.",
        },
      ],
    },
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await res.json();
  if (data.error) throw new Error(`Gemini 오류: ${data.error.message}`);

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 응답이 비어 있습니다.\n" + JSON.stringify(data, null, 2));
  return text;
}

// ── 메인
async function main() {
  console.log("📡 DB에서 최신 분석 데이터 조회 중...\n");

  const row = await fetchLatestAnalysis();
  console.log(
    `✅ 채널: ${row.channel_title}  |  분석일: ${row.created_at?.slice(0, 10)}\n`
  );

  const videos = extractVideos(row.feature_snapshot);
  console.log(`📹 영상 샘플 ${videos.length}개 확인\n`);

  const top3 = extractTop3(videos);
  const prompt = buildOnePagerPrompt(row, videos, top3);

  console.log("🤖 Gemini에 원페이퍼 기획안 요청 중...\n");
  console.log("═".repeat(60) + "\n");

  const result = await callGemini(prompt);

  console.log(result);
  console.log("\n" + "═".repeat(60));
  console.log("✅ 완료");
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
