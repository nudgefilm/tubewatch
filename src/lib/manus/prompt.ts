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
    "channel_name": "채널명",
    "channel_description": "채널 한 줄 소개",
    "channel_url": "채널 URL",
    "founded": "YYYY-MM",
    "subscribers": 0,
    "total_videos": 0,
    "total_views": 0,
    "analysis_date": "YYYY-MM-DD"
  },
  "section1_scorecard": {
    "grade": "B+",
    "overall_score": 78,
    "strengths": ["강점 1 (1~2문장)", "강점 2", "강점 3"],
    "weaknesses": ["약점 1 (1~2문장)", "약점 2", "약점 3"],
    "score_breakdown": {
      "growth_velocity":    {"grade": "B+", "score": 82, "comment": "성장 속도 진단 1~2문장"},
      "niche_authority":    {"grade": "B",  "score": 80, "comment": "니치 권위 진단 1~2문장"},
      "viral_potential":    {"grade": "A-", "score": 88, "comment": "바이럴 잠재력 진단 1~2문장"},
      "upload_regularity":  {"grade": "B-", "score": 72, "comment": "업로드 규칙성 진단 1~2문장"},
      "engagement_quality": {"grade": "B",  "score": 75, "comment": "참여 품질 진단 1~2문장"},
      "content_consistency":{"grade": "C+", "score": 70, "comment": "콘텐츠 일관성 진단 1~2문장"}
    }
  },
  "section2_growth_metrics": {
    "growth_trend": {
      "trend_comment": "성장 추세 요약 1~2문장",
      "growth_rate_pct": 0.0,
      "recent_10_avg_views": 0,
      "previous_10_avg_views": 0,
      "monthly_upload_last_30d": 0
    },
    "view_statistics": {
      "average_views": 0,
      "median_views": 0,
      "max_views": {"title": "최고 조회 영상 제목", "views": 0, "date": "YYYY-MM-DD"},
      "min_views":  {"title": "최저 조회 영상 제목", "views": 0, "date": "YYYY-MM-DD"},
      "total_views_50_videos": 0
    },
    "view_distribution": {
      "over_500k": 0,
      "under_50k": 0,
      "viral_ratio_pct": 0,
      "above_average_ratio_pct": 0
    },
    "engagement_metrics": {
      "avg_like_rate": 0.0,
      "avg_comment_rate": 0.0,
      "avg_likes_per_video": 0,
      "avg_comments_per_video": 0
    },
    "subscriber_efficiency": {
      "view_to_subscriber_ratio_pct": 0.0,
      "comment": "구독자 효율 진단 1문장"
    }
  },
  "section3_data_signals": {
    "high_performance_patterns": [
      {"pattern": "고성과 패턴명", "avg_views": 0, "description": "패턴 설명", "insight": "활용 인사이트"}
    ],
    "low_performance_patterns": [
      {"pattern": "저성과 패턴명", "avg_views": 0, "description": "패턴 설명", "insight": "개선 인사이트"}
    ],
    "keyword_analysis": {
      "high_ctr_keywords": ["키워드1", "키워드2", "키워드3"],
      "topic_performance": {
        "주제명": {"avg_views": 0, "share_pct": 0, "video_count": 0}
      }
    },
    "title_pattern_analysis": {
      "avg_title_length": 0.0,
      "optimal_title_length": "XX~XX자",
      "effective_structures": ["효과적 제목 구조1", "구조2", "구조3"],
      "hashtag_usage": {
        "avg_tags": 0.0,
        "effective_tags": "#태그1 #태그2 #태그3"
      }
    }
  },
  "section4_channel_patterns": {
    "upload_patterns": {
      "avg_upload_interval_days": 0.0,
      "recent_30d_uploads": 0,
      "upload_consistency": "규칙적/불규칙",
      "optimal_upload_frequency": "권장 업로드 빈도",
      "peak_upload_period": "YYYY-MM-DD ~ YYYY-MM-DD (XX일간 XX개)"
    },
    "audience_behavior": {
      "viral_trigger": "바이럴 발생 조건 1문장",
      "comment_driver": "댓글 유발 요인 1문장",
      "engagement_peak_content": "참여 피크 콘텐츠 유형"
    },
    "content_evolution": {
      "phase1": {"theme": "주제", "period": "기간", "description": "설명", "avg_views_estimate": 0},
      "phase2": {"theme": "주제", "period": "기간", "description": "설명", "avg_views_estimate": 0},
      "phase3": {"theme": "주제", "period": "기간", "description": "설명", "avg_views_estimate": 0}
    },
    "series_performance": {
      "시리즈_키": {"name": "시리즈명", "status": "활성/완료/하락", "avg_views": 0, "video_count": 0, "peak_video": "최고 영상 제목"}
    },
    "thumbnail_and_title_patterns": {
      "effective_title_formulas": ["효과적 제목 공식1", "공식2"],
      "effective_thumbnail_elements": ["썸네일 요소1", "요소2"]
    }
  },
  "section5_channel_dna": {
    "core_identity": "채널 핵심 정체성 2~3문장",
    "brand_keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
    "content_pillars": [
      {"pillar": "필러명", "description": "설명", "avg_performance": "성과 요약", "contribution_pct": 40}
    ],
    "creator_persona": {
      "character": "크리에이터 캐릭터 설명",
      "storytelling_style": "스토리텔링 방식",
      "relationship_with_audience": "시청자와의 관계"
    },
    "target_audience": {
      "primary": "1차 타겟 (연령·관심사 포함)",
      "secondary": "2차 타겟",
      "tertiary": "3차 타겟"
    },
    "unique_value_proposition": "고유 가치 제안 한 줄",
    "competitive_differentiation": "경쟁 차별화 포인트 한 줄"
  },
  "section6_content_plans": {
    "immediate_opportunities": [
      {
        "title": "추천 영상 제목 (구체적 예시 제목)",
        "concept": "기획 의도 1문장 — 왜 이 영상을 만들어야 하는가",
        "format": "영상 포맷 (예: 10~15분 중형 영상)",
        "rationale": "데이터 근거 1문장",
        "priority": 1,
        "title_formula": "제목 공식 템플릿",
        "expected_views": "XX만~XX만"
      }
    ],
    "series_concepts": [
      {
        "series_name": "시리즈명",
        "concept": "시리즈 기획 의도 1문장",
        "episode_count": 10,
        "target_views_per_episode": "XX만~XX만",
        "content_calendar": "주 X회 업로드"
      }
    ],
    "short_form_strategy": {
      "posting_frequency": "숏폼 업로드 빈도",
      "hashtag_strategy": "해시태그 전략 설명",
      "recommended_formats": ["포맷1", "포맷2"]
    }
  },
  "section7_action_plan": {
    "immediate_actions": {
      "timeframe": "1주차",
      "tasks": [
        {"task": "태스크명", "detail": "상세 실행 내용", "priority": "URGENT", "expected_impact": "기대 효과"}
      ]
    },
    "short_term_plan": {
      "timeframe": "2~3주차",
      "tasks": [
        {"task": "태스크명", "detail": "상세 실행 내용", "priority": "HIGH", "expected_impact": "기대 효과"}
      ]
    },
    "long_term_plan": {
      "timeframe": "4주차+",
      "tasks": [
        {"task": "태스크명", "detail": "상세 실행 내용", "priority": "NORMAL", "kpi": "KPI 지표", "timeline": "타임라인"}
      ]
    },
    "kpi_targets": {
      "1_month":  {"subscribers": 0, "upload_count": 0, "avg_views_per_video": 0},
      "3_months": {"subscribers": 0, "upload_count": 0, "avg_views_per_video": 0},
      "6_months": {"subscribers": 0, "upload_count": 0, "avg_views_per_video": 0},
      "12_months":{"subscribers": 0, "upload_count": 0, "avg_views_per_video": 0}
    },
    "risk_management": [
      {"risk": "리스크 내용", "mitigation": "대응 방안", "probability": "높음/보통/낮음"}
    ]
  }
}

[필수 항목 수]
- section1_scorecard.score_breakdown: 6개 항목 모두 포함 (comment 필드 필수)
- section2_growth_metrics: 5개 하위 객체 모두 포함
- section3_data_signals: high_performance_patterns 3개, low_performance_patterns 3개, high_ctr_keywords 5개 이상, topic_performance 3개 이상, effective_structures 3개 이상
- section4_channel_patterns: content_evolution 3단계 이상, series_performance 시리즈별 항목
- section5_channel_dna: content_pillars 3개, brand_keywords 5개 이상
- section6_content_plans.immediate_opportunities: 2개 (structure_flow 불필요)
- section6_content_plans.series_concepts: 1개
- section7_action_plan: immediate_actions·short_term_plan·long_term_plan 각 3개 태스크, kpi_targets 1/3/6/12개월 모두 포함`;

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
  lines.push("위 데이터를 기반으로 프로젝트 지침에 정의된 JSON 스키마를 완전히 채워서 출력하세요.");
  lines.push("파일 생성 금지. 메시지 본문에 JSON 객체만 직접 작성하세요. 설명 텍스트 없이 JSON만.");
  lines.push("");
  lines.push("최상위 키는 반드시 아래 8개만 사용하세요 (다른 키 추가 금지):");
  lines.push("channel_info, section1_scorecard, section2_growth_metrics, section3_data_signals, section4_channel_patterns, section5_channel_dna, section6_content_plans, section7_action_plan");

  return lines.join("\n");
}
