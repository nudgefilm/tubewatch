import type { NormalizedVideo } from "@/lib/analysis/engine/types";

export const MANUS_PROJECT_INSTRUCTION = `당신은 '튜브워치(TubeWatch)'의 수석 채널 분석가입니다. 제공된 YouTube 채널 데이터를 심층 분석하여, 정해진 7개 카테고리 구조에 맞게 완벽한 JSON 포맷으로 리포트를 생성해야 합니다.

[절대 규칙 — 반드시 준수]
- 파일을 생성하거나 저장하지 마세요. write_file, create_file 등 어떤 파일 시스템 도구도 사용하지 마세요.
- 웹 검색을 하지 마세요. 제공된 데이터만 사용하세요.
- 최종 답변은 반드시 채팅 메시지 본문에 JSON 객체만 직접 작성해야 합니다.
- 설명 문장, 마크다운, 코드블록 없이 JSON 객체 하나만 출력하세요.

[분석 지침]
1. 업계 평균이나 벤치마크 데이터는 추정하지 말고, 제공된 데이터의 절대 수치와 자체 알고리즘에 따른 평가(▲, ▼, →)만 수행하세요.
2. 분석 내용은 전문적이고 단호한 어조로 작성하되, 실행 가능한(Actionable) 인사이트를 포함해야 합니다.
3. 마크다운이나 기타 텍스트 없이 오직 JSON 객체만 출력하세요.

[출력 JSON 스키마 구조]
{
  "channel_info": {
    "name": "채널명",
    "description": "채널 한 줄 소개",
    "created_date": "YYYY.MM",
    "total_videos": 0,
    "subscribers": 0,
    "analysis_date": "YYYY.MM.DD"
  },
  "section1_scorecard": {
    "channel_score": 0.0,
    "grade": "A~F",
    "grade_label": "등급 설명 (예: 성장 초기 단계)",
    "metrics": [
      {"label": "총 조회수 (누적)", "value": "00,000", "sub_label": "▲ 전월 대비 +00%"},
      {"label": "구독자 수", "value": "00", "sub_label": "→ +0명"},
      {"label": "평균 조회수 (최근 50개 기준)", "value": "000", "sub_label": "▲ 중앙값 대비 0.0배"},
      {"label": "월 평균 업로드 수", "value": "0.0회", "sub_label": "▼ 최근 30일 0건"},
      {"label": "평균 좋아요율", "value": "0.00%", "sub_label": "▲ 우수"},
      {"label": "평균 댓글 참여율", "value": "0.00%", "sub_label": "▼ 개선 필요"},
      {"label": "평균 제목 길이", "value": "00.0자", "sub_label": "▲ 최적 범위"},
      {"label": "채널 개설일", "value": "YYYY.MM", "sub_label": "→ 운영 기간 약 0.0년"}
    ]
  },
  "section2_growth_metrics": [
    {"id": 1, "title": "구독자 성장률", "status": "정체", "status_type": "neutral", "value": "+00.0%", "label": "월간 구독자 증가율", "diagnosis": "진단 코멘트 1~2문장"}
  ],
  "section3_data_signals": {
    "content": [
      {"id": "01", "label": "업로드 주기", "value": "불규칙 · 평균 00일 간격", "status": "bad"}
    ],
    "performance": [
      {"id": "11", "label": "최고 조회 영상 배수", "value": "0,000회 · 평균의 0.0배", "status": "good"}
    ],
    "identity": [
      {"id": "21", "label": "주제 일관성", "value": "특정 주제 00% 집중", "status": "good"}
    ]
  },
  "section4_channel_patterns": [
    {"id": "01", "title": "업로드 패턴 (주기·요일·시간대)", "pattern": "발견된 패턴 요약", "interpretation": "해석 및 의미 1~2문장"}
  ],
  "section5_channel_dna": {
    "core_identity": "채널의 핵심 정체성을 2~3문장으로 요약.",
    "positioning": "포지셔닝 한 줄 정의",
    "strengths": [{"id": "01", "title": "강점 1", "description": "강점 설명"}],
    "weaknesses": [{"id": "01", "title": "약점 1", "description": "약점 설명"}]
  },
  "section6_content_plans": [
    {
      "id": 1,
      "titles": [
        {"type": "자극형", "title": "제목 후보 A"},
        {"type": "정보형", "title": "제목 후보 B"}
      ],
      "intent": "기획 의도 설명",
      "structure": ["도입부 (0~30초)", "본론 전개", "클라이맥스", "아웃트로"],
      "target_response": "예상 타겟 반응",
      "tags": ["태그1", "태그2", "태그3"],
      "audience_reaction": {"interest": 8, "shareability": 7, "engagement": 6, "informativeness": 9}
    }
  ],
  "section7_action_plan": {
    "month": "N월",
    "weeks": [
      {"week": 1, "title": "1주차 타이틀", "tasks": [{"title": "태스크 1", "priority": "URGENT"}]}
    ],
    "success_criteria": [
      {"label": "활동성 점수", "current": "현재값", "target": "목표값"},
      {"label": "평균 조회수", "current": "현재값", "target": "목표값"},
      {"label": "구독자 수", "current": "현재값", "target": "목표값"},
      {"label": "댓글 참여율", "current": "현재값", "target": "목표값"}
    ]
  }
}

[필수 항목 수]
- section2_growth_metrics: 반드시 9개
- section3_data_signals: content 10개, performance 10개, identity 10개 (총 30개)
- section4_channel_patterns: 반드시 7개
- section5_channel_dna: strengths 3개, weaknesses 3개
- section6_content_plans: 반드시 2개
- section7_action_plan.weeks: 1~4주차 모두 포함`;

export function buildReportPayload(data: {
  channelName: string;
  channelDescription: string;
  subscriberCount: number;
  totalViewCount: number;
  videoCount: number;
  publishedAt: string | null;
  metrics: {
    avgViewCount: number;
    medianViewCount: number;
    avgLikeRatio: number;
    avgCommentRatio: number;
    avgVideoDuration: number;
    avgUploadIntervalDays: number;
    recent30dUploadCount: number;
    avgTitleLength: number;
    avgTagCount: number;
  };
  videos: NormalizedVideo[];
  channelDna?: Record<string, unknown> | null;
  actionPlan?: Record<string, unknown> | null;
  nextTrend?: Record<string, unknown> | null;
}): string {
  const lines: string[] = [];

  lines.push("=== TubeWatch 채널 분석 데이터 ===");
  lines.push("");

  // 채널 기본 정보
  lines.push("[채널 기본 정보]");
  lines.push(`채널명: ${data.channelName}`);
  lines.push(`채널 설명: ${data.channelDescription || "(없음)"}`);
  lines.push(`개설일: ${data.publishedAt ? data.publishedAt.slice(0, 7) : "알 수 없음"}`);
  lines.push(`구독자 수: ${data.subscriberCount.toLocaleString()}명`);
  lines.push(`총 영상 수: ${data.videoCount.toLocaleString()}개`);
  lines.push(`총 조회수: ${data.totalViewCount.toLocaleString()}회`);
  lines.push("");

  // 채널 지표
  lines.push("[채널 지표 (최근 50개 영상 기준)]");
  lines.push(`평균 조회수: ${Math.round(data.metrics.avgViewCount).toLocaleString()}회`);
  lines.push(`중앙값 조회수: ${Math.round(data.metrics.medianViewCount).toLocaleString()}회`);
  lines.push(`평균 좋아요율: ${(data.metrics.avgLikeRatio * 100).toFixed(2)}%`);
  lines.push(`평균 댓글 참여율: ${(data.metrics.avgCommentRatio * 100).toFixed(2)}%`);
  lines.push(`평균 영상 길이: ${Math.round(data.metrics.avgVideoDuration)}초`);
  lines.push(`평균 업로드 간격: ${data.metrics.avgUploadIntervalDays.toFixed(1)}일`);
  lines.push(`최근 30일 업로드: ${data.metrics.recent30dUploadCount}건`);
  lines.push(`평균 제목 길이: ${data.metrics.avgTitleLength.toFixed(1)}자`);
  lines.push(`평균 태그 수: ${data.metrics.avgTagCount.toFixed(1)}개`);
  lines.push("");

  // 영상 데이터
  lines.push("[영상 데이터 (최근 50개)]");
  lines.push("순번|제목|조회수|좋아요|댓글|업로드일|길이(초)|참여율");
  data.videos.slice(0, 50).forEach((v, i) => {
    const published = v.publishedAt ? v.publishedAt.slice(0, 10) : "-";
    lines.push(
      `${i + 1}|${v.title}|${v.viewCount}|${v.likeCount}|${v.commentCount}|${published}|${v.durationSeconds}|${(v.engagementRate * 100).toFixed(2)}%`
    );
  });
  lines.push("");

  // 기존 모듈 분석 결과
  if (data.channelDna) {
    lines.push("[기존 Channel DNA 분석]");
    const dna = data.channelDna;
    if (Array.isArray(dna.content_patterns)) {
      lines.push(`콘텐츠 패턴: ${(dna.content_patterns as string[]).join(", ")}`);
    }
    if (Array.isArray(dna.strengths)) {
      lines.push(`강점: ${(dna.strengths as string[]).join(", ")}`);
    }
    if (Array.isArray(dna.weaknesses)) {
      lines.push(`약점: ${(dna.weaknesses as string[]).join(", ")}`);
    }
    if (dna.content_pattern_summary) {
      lines.push(`패턴 요약: ${String(dna.content_pattern_summary)}`);
    }
    lines.push("");
  }

  if (data.actionPlan) {
    lines.push("[기존 Action Plan 분석]");
    const ap = data.actionPlan;
    if (Array.isArray(ap.growth_action_plan)) {
      lines.push(`실행 계획: ${(ap.growth_action_plan as string[]).join(" / ")}`);
    }
    if (Array.isArray(ap.bottlenecks)) {
      lines.push(`병목 요인: ${(ap.bottlenecks as string[]).join(", ")}`);
    }
    lines.push("");
  }

  if (data.nextTrend) {
    lines.push("[기존 Next Trend 분석]");
    const nt = data.nextTrend;
    if (nt.analysis_confidence) {
      lines.push(`분석 신뢰도: ${String(nt.analysis_confidence)}`);
    }
    lines.push("");
  }

  lines.push("=== 출력 지시 ===");
  lines.push("위 데이터를 기반으로 프로젝트 지침에 정의된 7개 섹션 JSON 스키마를 완전히 채워서 출력하세요.");
  lines.push("파일 생성 금지. 메시지 본문에 JSON 객체만 직접 작성하세요. 설명 텍스트 없이 JSON만.");

  return lines.join("\n");
}
