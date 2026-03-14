import { BENCHMARK_AXES, type BenchmarkAxisKey } from "./benchmarkAxes";
import type {
  BenchmarkCompareItem,
  BenchmarkResultRow,
} from "@/components/benchmark/types";

function extractMetrics(
  snapshot: Record<string, unknown> | null
): Record<BenchmarkAxisKey, number> | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = snapshot.metrics;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const keys: BenchmarkAxisKey[] = [
    "avgViewCount",
    "avgLikeRatio",
    "avgCommentRatio",
    "avgUploadIntervalDays",
  ];
  const hasAny = keys.some((k) => typeof m[k] === "number");
  if (!hasAny) return null;
  const out: Record<string, number> = {};
  for (const k of keys) {
    out[k] = typeof m[k] === "number" ? (m[k] as number) : 0;
  }
  return out as Record<BenchmarkAxisKey, number>;
}

/**
 * current_score vs benchmark_score → status_label
 * - benchmark_score 이상: "기준 이상"
 * - benchmark_score - 10 이내: "근접"
 * - 그보다 낮으면: "개선 필요"
 */
function getStatusLabel(current: number, benchmark: number): string {
  if (current >= benchmark) return "기준 이상";
  if (current >= benchmark - 10) return "근접";
  return "개선 필요";
}

/**
 * analysis_results 한 건에서 벤치마크 비교 카드 4개를 생성합니다.
 * feature_snapshot.metrics 우선, 없으면 0점 + fallback.
 */
export function buildBenchmarkItemsFromResult(
  row: BenchmarkResultRow | null
): BenchmarkCompareItem[] {
  const items: BenchmarkCompareItem[] = [];

  if (!row || !row.feature_snapshot) {
    for (const axis of BENCHMARK_AXES) {
      items.push({
        title: axis.label,
        current_score: 0,
        benchmark_score: axis.benchmark,
        status_label: "개선 필요",
        source: "fallback",
      });
    }
    return items;
  }

  const metrics = extractMetrics(row.feature_snapshot);

  for (const axis of BENCHMARK_AXES) {
    const rawValue =
      metrics && typeof metrics[axis.key] === "number"
        ? metrics[axis.key]
        : 0;
    const current_score = Math.round(axis.normalize(rawValue));
    const benchmark_score = axis.benchmark;
    items.push({
      title: axis.label,
      current_score,
      benchmark_score,
      status_label: getStatusLabel(current_score, benchmark_score),
      source: metrics ? "feature_snapshot" : "fallback",
    });
  }

  return items;
}

/**
 * 비교 카드 4개 결과를 바탕으로 요약 문장 3개 생성.
 * 실제 비교 결과 기반 문장만 사용.
 */
export function buildBenchmarkSummaries(
  compareItems: BenchmarkCompareItem[]
): string[] {
  const lines: string[] = [];
  const statusToSuffix: Record<string, string> = {
    "기준 이상": "는 기준 대비 강점입니다.",
    근접: "는 기준에 근접했습니다.",
    "개선 필요": "는 추가 개선이 필요합니다.",
  };
  for (let i = 0; i < Math.min(3, compareItems.length); i++) {
    const item = compareItems[i];
    const suffix = statusToSuffix[item.status_label] ?? "는 추가 확인이 필요합니다.";
    lines.push(`${item.title}${suffix}`);
  }
  if (lines.length === 0) {
    lines.push("아직 비교 데이터가 충분하지 않습니다.");
  }
  return lines;
}
