import type { AnalysisRunAnalysisType } from "@/lib/analysis/analysisRun";

/**
 * 메뉴별 확장 분석 — 베이스(`analysis_results` / `feature_snapshot`) 재사용과
 * 향후 확장 수집 범위를 한곳에 정리한다.
 *
 * - **현재 DB에 저장되는 것**: `analysis_runs` 행(상태·`input_snapshot_id` = 베이스 row id 등).
 * - **아직 저장하지 않는 것**: 메뉴별 `result_snapshot_id` / 파생 JSONB / 별도 스냅샷 테이블.
 */

export type MenuExtensionStrategyKey = Exclude<AnalysisRunAnalysisType, "base">;

export type MenuExtensionStrategy = {
  readonly menuKey: MenuExtensionStrategyKey;
  /** UI·주석용 한 줄 요약 */
  readonly summary: string;
  /** 베이스에서 재사용하는 데이터(논리 필드명·설명) */
  readonly baseReuseFields: readonly string[];
  /** 확장 run·외부 API로만 채울 필드 — TODO 구현 시 이 목록을 기준으로 분리 */
  readonly futureCollectionFields: readonly string[];
  /** 이 메뉴의 `analysis_runs`가 현재 의미하는 바 */
  readonly runSemantics: string;
};

export const MENU_EXTENSION_STRATEGIES: Record<
  MenuExtensionStrategyKey,
  MenuExtensionStrategy
> = {
  action_plan: {
    menuKey: "action_plan",
    summary:
      "베이스 스냅샷·구간 점수·약점/병목 문자열로 카드·체크리스트를 구성하고, run은 실행 이력만 남긴다.",
    baseReuseFields: [
      "analysis_results.feature_snapshot (표본 영상·메트릭 요약)",
      "feature_section_scores (5구간 점수)",
      "weaknesses, bottlenecks (문자열 배열)",
      "sample_size_note, analysis_confidence",
    ],
    futureCollectionFields: [
      "액션별 외부 벤치마크·경쟁 채널 스냅샷",
      "사용자 체크리스트 완료율·로컬 메모",
    ],
    runSemantics:
      "action_plan 타입 run = 이 채널에서 액션 플랜 ‘확장 파이프라인’을 돌렸다는 이력. 결과 본문은 아직 베이스 파생만 표시.",
  },
  seo_lab: {
    menuKey: "seo_lab",
    summary:
      "동일 베이스 스냅샷에서 SEO·구조 구간 점수와 제목 표본·패턴 플래그만 읽어 점검 카드를 만든다.",
    baseReuseFields: [
      "feature_snapshot (제목 표본, 태그·길이 등 메트릭이 있으면)",
      "feature_section_scores.seoOptimization, contentStructure",
      "patterns / 플래그 기반 인사이트 카드",
    ],
    futureCollectionFields: [
      // TODO: 확장 수집 — YouTube 외부 SERP/검색볼륨/키워드 도구 API
      "외부 검색 볼륨·연관 키워드",
      "실시간 상위 노출 키워드(크롤/서드파티)",
      "썸네일·제목 A/B 실험 로그",
    ],
    runSemantics:
      "seo_lab 타입 run = SEO Lab 확장 실행 이력. 화면 데이터는 여전히 베이스만으로 재구성 가능한 범위.",
  },
  channel_dna: {
    menuKey: "channel_dna",
    summary:
      "내부 베이스 지표만으로 레이더·비교 카드 UI 뼈대를 유지하고, 외부 경쟁 데이터 없음을 명시한다.",
    baseReuseFields: [
      "analysis_results에서 파생된 채널 요약(구독·조회·영상 수 등, 스냅샷에 있으면)",
      "내부 섹션 점수 기반 레이더 값(현재는 UI 시드·베이스 연동 정책에 따름)",
    ],
    futureCollectionFields: [
      "외부 경쟁 채널 메트릭",
      "카테고리·니치 시장 평균",
      "YouTube Data API 기반 타 채널 공개 지표",
    ],
    runSemantics:
      "channel_dna 타입 run = Channel DNA 메뉴 확장 실행 이력. 외부 벤치마크 미연동 상태와 충돌하지 않음(안내 문구 유지).",
  },
  next_trend: {
    menuKey: "next_trend",
    summary:
      "트렌드·아이디어 클러스터는 베이스만으로는 부족하며, 확장 수집·모델 연동 전까지 UI는 준비 상태로 둔다.",
    baseReuseFields: [
      "analysis_results.id (input_snapshot_id로 run이 베이스 행을 가리킴)",
      "향후: 채널 주제·카테고리·최근 업로드 제목 패턴(feature_snapshot)",
    ],
    futureCollectionFields: [
      "플랫폼/카테고리 트렌드 시그널",
      "검색·SNS 트렌드 API",
      "추천 주제 클러스터·적합도 점수(모델 출력)",
    ],
    runSemantics:
      "next_trend 타입 run = Next Trend 확장 파이프라인 실행 이력(준비). 본문 결과 스냅샷은 미저장.",
  },
};

export function getMenuExtensionStrategy(
  key: MenuExtensionStrategyKey
): MenuExtensionStrategy {
  return MENU_EXTENSION_STRATEGIES[key];
}

/** 일반 법무·운영 안내(실시간 분석 수치 아님) — UI 정적 문구용 */
export const NEXT_TREND_GENERAL_EDUCATION_WARNINGS: readonly {
  title: string;
  description: string;
}[] = [
  {
    title: "과도한 클릭베이트 주의",
    description:
      "제목·썸네일이 내용과 다르면 이탈이 늘고 채널 신뢰에 부정적일 수 있습니다.",
  },
  {
    title: "저작권·라이선스 준수",
    description:
      "허가 없는 음원·영상 클립 사용은 제재·수익 정지로 이어질 수 있습니다.",
  },
];
