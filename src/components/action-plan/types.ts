/**
 * 액션 플랜 페이지에서 사용하는 타입.
 * analysis_results 기반 표시만 하며, 엔진/DB 구조는 변경하지 않음.
 */

export type ActionItemSourceDetail =
  | "growth_action_plan"
  | "weakness_bottleneck"
  | "low_metric"
  | "fallback";

/** 빌더 내부용 — 저점수 축 식별 */
export type ActionMetricAxisKey =
  | "avgViewCount"
  | "avgLikeRatio"
  | "avgCommentRatio"
  | "avgUploadIntervalDays"
  | "recent30dUploadCount"
  | "avgTagCount"
  | null;

export type ActionItem = {
  title: string;
  reason: string;
  /** 레거시 필드 — 스펙 화면에서는 예상 효과 시나리오로 치환 */
  expected_impact: string;
  source: string;
  sourceDetail: ActionItemSourceDetail;
  axisKey: ActionMetricAxisKey;
};

/** 확정 스펙: 실행 우선순위 + 영역 + 액션 카드 */
export type ActionImpactArea =
  | "조회·도달"
  | "반응·참여"
  | "콘텐츠 구조"
  | "업로드·일관성"
  | "SEO·메타"
  | "성장·전략";

/** 액션 카드 하위 — 실행 보조(Smart Assist), 외부 도구 제안용 */
export type ActionSmartAssist = {
  toolName: string;
  reason: string;
  promptExample: string;
  effect: string;
};

export type ActionPlanSpecItem = {
  priority: "P1" | "P2" | "P3";
  impact_area: ActionImpactArea;
  action_title: string;
  need_reason: string;
  evidence_data: string;
  expected_effect_scenario: string;
  difficulty: "낮음" | "중간" | "높음";
  confidence_label: "낮음" | "중간" | "높음";
  confidence_note: string;
  execution_example: string;
  scope: string;
  /** 제목·이유·영향 영역 기반 도구 추천(클라이언트 생성 아님) */
  smart_assist: ActionSmartAssist;
};

export type ActionPlanChecklistSpec = {
  dos: string[];
  donts: string[];
  core_single_action: string;
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
  /** Channel DNA 스냅샷 기준 실행 전략 스펙 */
  specItems: ActionPlanSpecItem[];
  checklist: ActionPlanChecklistSpec;
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
