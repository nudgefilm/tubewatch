import type { ActionItem, ActionPlanResultRow } from "@/components/action-plan/types";

/**
 * ChannelDnaRadar과 동일한 보간 로직으로 0~100 점수 계산.
 * 분석 로직/엔진 변경 없이 기존 스냅샷 값만 사용.
 */
function interpolate(value: number, breakpoints: [number, number][]): number {
  if (breakpoints.length === 0) return 0;
  if (value <= breakpoints[0][0]) return breakpoints[0][1];
  for (let i = 1; i < breakpoints.length; i++) {
    const [x0, y0] = breakpoints[i - 1];
    const [x1, y1] = breakpoints[i];
    if (value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return Math.max(0, Math.min(100, y0 + t * (y1 - y0)));
    }
  }
  return Math.min(100, breakpoints[breakpoints.length - 1][1]);
}

type AxisKey =
  | "avgViewCount"
  | "avgLikeRatio"
  | "avgCommentRatio"
  | "avgUploadIntervalDays"
  | "recent30dUploadCount"
  | "avgTagCount";

type AxisConfig = {
  key: AxisKey;
  baseline: number;
  normalize: (v: number) => number;
  fallbackTitle: string;
  fallbackReason: string;
};

const AXES: AxisConfig[] = [
  {
    key: "avgViewCount",
    baseline: 70,
    normalize: (v) => interpolate(v, [[0, 0], [1000, 40], [5000, 70], [10000, 100]]),
    fallbackTitle: "대표 콘텐츠 포맷 재정의",
    fallbackReason: "조회수 경쟁력 약세",
  },
  {
    key: "avgLikeRatio",
    baseline: 70,
    normalize: (v) => interpolate(v, [[0, 0], [0.03, 60], [0.06, 100]]),
    fallbackTitle: "썸네일·제목 개선 실험",
    fallbackReason: "좋아요 반응 낮음",
  },
  {
    key: "avgCommentRatio",
    baseline: 60,
    normalize: (v) => interpolate(v, [[0, 0], [0.005, 60], [0.01, 100]]),
    fallbackTitle: "질문형 CTA 추가",
    fallbackReason: "댓글 참여도 낮음",
  },
  {
    key: "avgUploadIntervalDays",
    baseline: 70,
    normalize: (v) => interpolate(v, [[0, 100], [3, 100], [7, 70], [14, 40], [30, 10]]),
    fallbackTitle: "업로드 주기 고정",
    fallbackReason: "업로드 규칙성 낮음",
  },
  {
    key: "recent30dUploadCount",
    baseline: 70,
    normalize: (v) => interpolate(v, [[0, 0], [4, 50], [8, 80], [12, 100]]),
    fallbackTitle: "업로드 재개 계획 수립",
    fallbackReason: "최근 활동성 점수 낮음",
  },
  {
    key: "avgTagCount",
    baseline: 60,
    normalize: (v) => interpolate(v, [[0, 0], [5, 60], [10, 100]]),
    fallbackTitle: "태그/메타데이터 정비",
    fallbackReason: "SEO 태그 활용 부족",
  },
];

function extractMetrics(snapshot: Record<string, unknown> | null): Record<AxisKey, number> | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = snapshot.metrics;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const hasAny = AXES.some((a) => typeof m[a.key] === "number");
  if (!hasAny) return null;
  const out: Record<string, number> = {};
  for (const a of AXES) {
    out[a.key] = typeof m[a.key] === "number" ? (m[a.key] as number) : 0;
  }
  return out as Record<AxisKey, number>;
}

function safeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

/**
 * analysis_results 한 건에서 우선순위 액션 3개를 생성합니다.
 * A) growth_action_plan 우선 사용
 * B) weaknesses / bottlenecks 기반 보충
 * C) feature_snapshot 저점수 구간 fallback
 * D) 없으면 기본 3개 문구로 채움
 */
export function buildActionItemsFromResult(row: ActionPlanResultRow | null): ActionItem[] {
  const out: ActionItem[] = [];
  const usedTitles = new Set<string>();

  function add(item: ActionItem): void {
    if (out.length >= 3) return;
    const key = item.title.slice(0, 50);
    if (usedTitles.has(key)) return;
    usedTitles.add(key);
    out.push(item);
  }

  if (!row) {
    out.push(
      { title: "업로드 재개 계획 수립", reason: "최근 활동성 점수 낮음", expected_impact: "", source: "fallback" },
      { title: "태그/메타데이터 정비", reason: "SEO 태그 활용 부족", expected_impact: "", source: "fallback" },
      { title: "대표 콘텐츠 포맷 재정의", reason: "조회수 경쟁력 약세", expected_impact: "", source: "fallback" }
    );
    return out;
  }

  const plan = safeStringArray(row.growth_action_plan);
  for (let i = 0; i < Math.min(3, plan.length); i++) {
    add({
      title: plan[i],
      reason: "AI 성장 액션 플랜",
      expected_impact: "",
      source: "growth_action_plan",
    });
  }

  if (out.length < 3) {
    const weak = safeStringArray(row.weaknesses);
    const bottle = safeStringArray(row.bottlenecks);
    const combined = [...weak, ...bottle];
    for (const text of combined) {
      if (out.length >= 3) break;
      add({
        title: text.length > 60 ? `${text.slice(0, 57)}...` : text,
        reason: "분석 감지 약점/병목",
        expected_impact: "",
        source: "weaknesses_bottlenecks",
      });
    }
  }

  const metrics = extractMetrics(row.feature_snapshot);
  if (out.length < 3 && metrics) {
    const lowAxes: AxisConfig[] = [];
    for (const axis of AXES) {
      const value = metrics[axis.key];
      const score = axis.normalize(value);
      if (score < axis.baseline) lowAxes.push(axis);
    }
    for (const axis of lowAxes) {
      if (out.length >= 3) break;
      add({
        title: axis.fallbackTitle,
        reason: axis.fallbackReason,
        expected_impact: "",
        source: "low_score_section",
      });
    }
  }

  while (out.length < 3) {
    const axis = AXES[out.length % AXES.length];
    add({
      title: axis.fallbackTitle,
      reason: axis.fallbackReason,
      expected_impact: "",
      source: "fallback",
    });
  }

  return out.slice(0, 3);
}
