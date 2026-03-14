/**
 * 액션 플랜 페이지에서 사용하는 타입.
 * analysis_results 기반 표시만 하며, 엔진/DB 구조는 변경하지 않음.
 */

export type ActionItem = {
  title: string;
  reason: string;
  expected_impact: string;
  source: string;
};

export type ActionPlanChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analyzed_at: string | null;
};

export type ActionPlanPageData = {
  channels: ActionPlanChannel[];
  selectedChannel: ActionPlanChannel | null;
  latestResult: ActionPlanResultRow | null;
  actions: ActionItem[];
};

/**
 * getActionPlanPageData / buildActionItemsFromResult에서 사용하는 분석 결과 행 타입.
 * analysis_results 테이블 컬럼과 호환.
 */
export type ActionPlanResultRow = {
  id: string;
  user_channel_id: string;
  status: string | null;
  channel_summary: string | null;
  growth_action_plan: string[] | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  feature_snapshot: Record<string, unknown> | null;
  feature_section_scores: Record<string, number> | null;
  created_at: string | null;
};
