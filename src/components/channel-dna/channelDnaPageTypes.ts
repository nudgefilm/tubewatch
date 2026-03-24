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
  created_at: string | null;
  last_analyzed_at: string | null;
};

export type ChannelDnaPageData = {
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
