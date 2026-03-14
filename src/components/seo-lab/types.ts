/**
 * SEO 랩 페이지에서 사용하는 타입.
 * analysis_results 기반 표시만 하며, 엔진/DB 구조는 변경하지 않음.
 */

export type SeoLabCardItem = {
  /** 카드 구역 제목 (제목/썸네일 훅, 설명/메타데이터, 태그 활용) */
  title: string;
  /** 현재 상태/근거 한 줄 */
  current_status: string;
  /** 추천 개선 액션 */
  recommendation: string;
  /** 데이터 출처 */
  source: string;
};

export type SeoLabChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analyzed_at: string | null;
};

export type SeoLabPageData = {
  channels: SeoLabChannel[];
  selectedChannel: SeoLabChannel | null;
  latestResult: SeoLabResultRow | null;
  cards: SeoLabCardItem[];
};

/**
 * getSeoLabPageData / buildSeoLabItemsFromResult에서 사용하는 분석 결과 행 타입.
 * analysis_results 테이블 컬럼 + 선택적 seo 관련 필드.
 */
export type SeoLabResultRow = {
  id: string;
  user_channel_id: string;
  status: string | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  feature_snapshot: Record<string, unknown> | null;
  feature_section_scores: Record<string, number> | null;
  created_at: string | null;
  /** 선택: DB에 있으면 사용 */
  seo_insights?: unknown;
  metadata_insights?: unknown;
  title_insights?: unknown;
  tags_insights?: unknown;
  recommendations?: unknown;
  [key: string]: unknown;
};
