/**
 * 액션 플랜 페이지 전용 표현 레이어 — 기존 `ActionPlanPageData`만 사용, 수집·엔진 로직 없음.
 */
import type {
  ActionItem,
  ActionPlanPageData,
  ActionPlanSpecItem,
} from "@/components/action-plan/types";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";

export type ActionPlanStrategyVm = {
  problemLine: string;
  strategyLine: string;
  outcomeLine: string;
};

export type ActionPlanTrackingKpiVm = {
  label: string;
  beforeLabel: string;
  afterLabel: string;
};

export type ActionPlanChecklistStepVm = {
  step: number;
  description: string;
  expected: string;
  horizon: string;
};

function readMetrics(row: ActionPlanPageData["latestResult"]): Partial<ChannelMetrics> | null {
  if (!row?.feature_snapshot || typeof row.feature_snapshot !== "object") return null;
  const m = (row.feature_snapshot as Record<string, unknown>).metrics;
  if (!m || typeof m !== "object") return null;
  return m as Partial<ChannelMetrics>;
}

/** 카드별 근거 숫자 한 줄 — 스냅샷 metrics + 액션 축만 사용 */
export function numericEvidenceLine(
  action: ActionItem | undefined,
  row: ActionPlanPageData["latestResult"]
): string {
  const metrics = readMetrics(row);
  if (!metrics || !action) return "표본 부족 — 관찰 필요";
  const k = action.axisKey;
  if (k === "recent30dUploadCount" && metrics.recent30dUploadCount != null) {
    return `최근 30일 업로드 ${Math.round(metrics.recent30dUploadCount)}건`;
  }
  if (k === "avgViewCount" && metrics.avgViewCount != null) {
    return `표본 평균 조회 ${Math.round(metrics.avgViewCount).toLocaleString("ko-KR")}`;
  }
  if (k === "avgLikeRatio" && metrics.avgLikeRatio != null) {
    return `평균 좋아요 비율 ${(metrics.avgLikeRatio * 100).toFixed(2)}%`;
  }
  if (k === "avgCommentRatio" && metrics.avgCommentRatio != null) {
    return `평균 댓글 비율 ${(metrics.avgCommentRatio * 100).toFixed(2)}%`;
  }
  if (k === "avgUploadIntervalDays" && metrics.avgUploadIntervalDays != null) {
    return `평균 업로드 간격 ${metrics.avgUploadIntervalDays.toFixed(1)}일`;
  }
  if (k === "avgTagCount" && metrics.avgTagCount != null) {
    return `평균 태그 수 ${metrics.avgTagCount.toFixed(1)}개`;
  }
  if (metrics.recent30dUploadCount != null) {
    return `최근 30일 업로드 ${Math.round(metrics.recent30dUploadCount)}건 (참고)`;
  }
  return "관찰 필요 — 동일 스냅샷 내 다른 지표를 함께 보세요.";
}

export function buildActionPlanStrategy(data: ActionPlanPageData): ActionPlanStrategyVm {
  const wk = data.latestResult?.weaknesses;
  const weak = Array.isArray(wk) && typeof wk[0] === "string" ? wk[0] : null;
  const firstDo = data.checklist.dos[0];
  const p1 = data.specItems[0];
  return {
    problemLine:
      weak ??
      firstDo ??
      "저장된 약점 문구가 없으면 표본·신호가 부족할 수 있습니다.",
    strategyLine: p1
      ? `우선 ${p1.action_title}에 집중하고, 변수는 한 번에 하나만 바꿉니다.`
      : "채널 분석을 완료하면 실행 우선순위가 채워집니다.",
    outcomeLine: p1
      ? p1.expected_effect_scenario.slice(0, 160) +
        (p1.expected_effect_scenario.length > 160 ? "…" : "")
      : "지표 개선을 보장하지 않는 가정입니다. 소규모 실험 후 동일 지표로 확인하세요.",
  };
}

export function buildTrackingKpis(_data: ActionPlanPageData): ActionPlanTrackingKpiVm[] {
  return [
    { label: "핵심 지표 1", beforeLabel: "적용 전 · 기록", afterLabel: "적용 후 · 기록" },
    { label: "핵심 지표 2", beforeLabel: "—", afterLabel: "—" },
    { label: "핵심 지표 3", beforeLabel: "—", afterLabel: "—" },
  ];
}

export type StrategyHeaderVm = {
  /** 핵심 전략 1줄 */
  strategyOneLiner: string;
  /** 좋음 / 보통 / 위험 */
  health: "good" | "medium" | "risk";
  healthLabel: string;
  /** 추천 방향 1줄 */
  directionLine: string;
};

function readSectionScores(
  row: ActionPlanPageData["latestResult"]
): Partial<Record<"audienceResponse" | "channelActivity" | "seoOptimization", number>> | null {
  const raw = row?.feature_section_scores;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<
    Record<"audienceResponse" | "channelActivity" | "seoOptimization", number>
  > = {};
  for (const k of ["audienceResponse", "channelActivity", "seoOptimization"] as const) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = Math.max(0, Math.min(100, v));
    }
  }
  return Object.keys(out).length ? out : null;
}

function avgSectionScore(row: ActionPlanPageData["latestResult"]): number | null {
  const raw = row?.feature_section_scores;
  if (!raw || typeof raw !== "object") return null;
  const vals = Object.values(raw as Record<string, unknown>).filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function buildStrategyHeaderVm(data: ActionPlanPageData): StrategyHeaderVm {
  const p1 = data.specItems[0];
  const strat = buildActionPlanStrategy(data);
  const avg = avgSectionScore(data.latestResult);
  let health: StrategyHeaderVm["health"] = "medium";
  let healthLabel = "보통";
  if (avg != null) {
    if (avg >= 58) {
      health = "good";
      healthLabel = "좋음";
    } else if (avg <= 42) {
      health = "risk";
      healthLabel = "위험";
    }
  } else if (!data.latestResult) {
    health = "risk";
    healthLabel = "위험";
  }
  return {
    strategyOneLiner: p1?.action_title ?? strat.problemLine.slice(0, 96),
    health,
    healthLabel,
    directionLine: strat.strategyLine.slice(0, 140) + (strat.strategyLine.length > 140 ? "…" : ""),
  };
}

export type KpiMiniVm = {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
};

function trendFromScore(score: number | undefined): KpiMiniVm["trend"] {
  if (score == null) return "neutral";
  if (score >= 58) return "up";
  if (score <= 42) return "down";
  return "neutral";
}

/** 스냅샷 기반 CTR 필드가 없으면 명시적으로 데이터 부족 처리 */
function readCtrFromSnapshot(row: ActionPlanPageData["latestResult"]): string | null {
  if (!row?.feature_snapshot || typeof row.feature_snapshot !== "object") return null;
  const snap = row.feature_snapshot as Record<string, unknown>;
  const metrics = snap.metrics;
  if (!metrics || typeof metrics !== "object") return null;
  const m = metrics as Record<string, unknown>;
  const ctr = m.ctr ?? m.clickThroughRate ?? m.ctr_estimate;
  if (typeof ctr === "number" && Number.isFinite(ctr)) {
    return `${(ctr <= 1 ? ctr * 100 : ctr).toFixed(1)}%`;
  }
  return null;
}

/**
 * P1/P2/P3 공통 하단 KPI 스트립 — 동일 스냅샷 수치(표현만 분리).
 */
export function buildKpiMiniTriple(data: ActionPlanPageData): KpiMiniVm[] {
  const metrics = readMetrics(data.latestResult);
  const scores = readSectionScores(data.latestResult);
  const ctr = readCtrFromSnapshot(data.latestResult);

  const views =
    metrics?.avgViewCount != null
      ? `${Math.round(metrics.avgViewCount).toLocaleString("ko-KR")}`
      : "데이터 부족";
  const upload =
    metrics?.recent30dUploadCount != null
      ? `${Math.round(metrics.recent30dUploadCount)}건/30일`
      : metrics?.avgUploadIntervalDays != null
        ? `간격 ${metrics.avgUploadIntervalDays.toFixed(1)}일`
        : "데이터 부족";

  return [
    {
      label: "CTR",
      value: ctr ?? "데이터 부족",
      trend: trendFromScore(scores?.seoOptimization),
    },
    {
      label: "평균 조회수",
      value: views,
      trend: trendFromScore(scores?.audienceResponse),
    },
    {
      label: "업로드 빈도",
      value: upload,
      trend: trendFromScore(scores?.channelActivity),
    },
  ];
}

/** 우선순위별 KPI 블록 — 수치는 동일 스냅샷, 제목·순서·밀도만 표현 차등 */
export type KpiStripLayout = "hero" | "standard" | "compact";

export type KpiStripForPriorityVm = {
  heading: string;
  subline: string;
  items: KpiMiniVm[];
  layout: KpiStripLayout;
};

export function buildKpiStripForPriority(
  data: ActionPlanPageData,
  priority: "P1" | "P2" | "P3"
): KpiStripForPriorityVm {
  const triple = buildKpiMiniTriple(data);
  const [ctr, views, upload] = triple;

  switch (priority) {
    case "P1":
      return {
        heading: "즉시 실행 KPI",
        subline: "동일 스냅샷 기준선 · 적용 후 48~72시간 안에 같은 지표로 재확인",
        items: [views, upload, ctr],
        layout: "hero",
      };
    case "P2":
      return {
        heading: "단기 추적 KPI (1~2주)",
        subline: "주간 단위로만 기록해 조기 판단·과교정을 줄입니다.",
        items: [ctr, views, upload],
        layout: "standard",
      };
    case "P3":
      return {
        heading: "구조·리듬 KPI (중장기)",
        subline: "업로드·리듬 변화를 월 단위로 보고, 한 번에 변수 하나만 조정합니다.",
        items: [upload, views, ctr],
        layout: "compact",
      };
  }
}

export function buildChecklistSteps(data: ActionPlanPageData): ActionPlanChecklistStepVm[] {
  const steps: ActionPlanChecklistStepVm[] = [];
  let n = 1;
  for (const line of data.checklist.dos) {
    steps.push({
      step: n,
      description: line,
      expected: "동일 지표 전후 비교 가능한 변화 신호",
      horizon: "2주",
    });
    n += 1;
    if (steps.length >= 5) break;
  }
  for (const line of data.checklist.donts) {
    if (steps.length >= 6) break;
    steps.push({
      step: n,
      description: `피하기: ${line}`,
      expected: "변수 혼선·해석 불가 방지",
      horizon: "상시",
    });
    n += 1;
  }
  if (steps.length === 0) {
    steps.push({
      step: 1,
      description: "데이터 부족 — 분석 완료 후 단계가 채워집니다.",
      expected: "—",
      horizon: "—",
    });
  }
  return steps;
}

export function difficultyPercent(d: ActionPlanSpecItem["difficulty"]): number {
  if (d === "낮음") return 33;
  if (d === "중간") return 66;
  return 100;
}

export function confidencePercent(label: ActionPlanSpecItem["confidence_label"]): number {
  if (label === "높음") return 90;
  if (label === "중간") return 55;
  return 25;
}

export function humanizeScope(scope: string): string {
  return scope
    .replace(/`gemini_status=success`/g, "분석 성공")
    .replace(/`status=analyzed`/g, "분석 완료")
    .replace(/Gemini/gi, "TubeWatch 엔진");
}
