/**
 * 채널 DNA 페이지에서 사용하는 타입.
 * analysis_results 기반 표시만 하며, 엔진/DB 구조는 변경하지 않음.
 */

export type ChannelDnaCompareItem = {
  /** 축 라벨 (조회수 경쟁력, 좋아요 반응, 댓글 참여도, 업로드 규칙성) */
  title: string;
  /** 현재 채널 점수 (0~100) */
  current_score: number;
  /** 기준(베이스라인) 점수 */
  baseline_score: number;
  /** 기준 이상 | 근접 | 개선 필요 */
  status_label: string;
  /** 데이터 출처 */
  source: string;
};

export type ChannelDnaChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  /** YouTube 공개 API·DB `user_channels` 기준, 내부 요약에 사용 */
  video_count: number | null;
  created_at: string | null;
  last_analyzed_at: string | null;
};

/** 공개 API·계산·AI 해석 구분 (UI 라벨용) */
export type ChannelDnaSourceTag = "youtube_api" | "computed" | "ai_interpretation";

export type ChannelDnaSpecLine = {
  label: string;
  body: string;
  source: ChannelDnaSourceTag;
};

/**
 * Channel DNA 확정 스펙: 성과 구조 요약 / 반복 패턴 / DNA 카드 / 성장 축 지표.
 */
export type ChannelDnaSpecViewModel = {
  dataPipelineNote: string;
  performanceStructure: {
    hitDependency: ChannelDnaSpecLine;
    performanceDistribution: ChannelDnaSpecLine;
    growthModeDefinition: ChannelDnaSpecLine;
    growthAxisClassification: ChannelDnaSpecLine;
  };
  repetitionPatterns: {
    highPerformerCommonalities: ChannelDnaSpecLine;
    titleStructurePatterns: ChannelDnaSpecLine;
    formatLengthRepeat: ChannelDnaSpecLine;
    topicCluster: ChannelDnaSpecLine;
    uploadVsPerformance: ChannelDnaSpecLine;
  };
  dnaCards: {
    strengthPattern: ChannelDnaSpecLine;
    weaknessPattern: ChannelDnaSpecLine;
    maintenanceCore: ChannelDnaSpecLine;
    hitDependenceRisk: ChannelDnaSpecLine;
  };
  /** 통합 내러티브(표본·편차·의존도·업로드) */
  channelDnaNarrative: string | null;
};

export type ChannelDnaPageData = {
  /** 세션 사용자 — 내부 요약 VM 연결용 */
  userId: string;
  channels: ChannelDnaChannel[];
  selectedChannel: ChannelDnaChannel | null;
  latestResult: ChannelDnaResultRow | null;
  compareItems: ChannelDnaCompareItem[];
  summaries: string[];
};

/**
 * getChannelDnaPageData / buildChannelDnaCompareItems에서 사용하는 분석 결과 행 타입.
 */
export type ChannelDnaResultRow = {
  id: string;
  user_channel_id: string;
  status: string | null;
  feature_snapshot: Record<string, unknown> | null;
  feature_section_scores: Record<string, number> | null;
  created_at: string | null;
};
