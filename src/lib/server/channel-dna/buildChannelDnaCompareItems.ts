import { CHANNEL_DNA_AXES } from "./channelDnaAxes";
import type {
  ChannelDnaCompareItem,
  ChannelDnaResultRow,
} from "@/components/channel-dna/channelDnaPageTypes";
import { normalizeFeatureSnapshot } from "@/lib/analysis/normalizeSnapshot";

/**
 * current_score vs baseline_score → status_label
 * - baseline 이상: "기준 이상"
 * - baseline - 10 이내: "근접"
 * - 그보다 낮으면: "개선 필요"
 */
function getStatusLabel(current: number, baseline: number): string {
  if (current >= baseline) return "기준 이상";
  if (current >= baseline - 10) return "근접";
  return "개선 필요";
}

/**
 * analysis_results 한 건에서 채널 DNA 비교 카드 4개를 생성합니다.
 * feature_snapshot.metrics 우선, 없으면 0점 + fallback.
 */
export function buildChannelDnaCompareItems(
  row: ChannelDnaResultRow | null
): ChannelDnaCompareItem[] {
  const items: ChannelDnaCompareItem[] = [];

  if (!row) {
    for (const axis of CHANNEL_DNA_AXES) {
      items.push({
        title: axis.label,
        current_score: 0,
        baseline_score: axis.baseline,
        status_label: "개선 필요",
        source: "fallback",
      });
    }
    return items;
  }

  // 공통 정규화 레이어: raw snapshot → NormalizedSnapshot (단일 진입점)
  const normalized = normalizeFeatureSnapshot(row.feature_snapshot);
  const metricsNorm = normalized.metrics; // Record<string, number> | null

  for (const axis of CHANNEL_DNA_AXES) {
    // metricsNorm[axis.key]는 Record<string, number>로 타입되지만 키 미존재 시 undefined(런타임)
    const rawValue =
      metricsNorm != null && typeof (metricsNorm as Record<string, unknown>)[axis.key] === "number"
        ? metricsNorm[axis.key]
        : 0;
    const current_score = Math.round(axis.normalize(rawValue));
    const baseline_score = axis.baseline;
    items.push({
      title: axis.label,
      current_score,
      baseline_score,
      status_label: getStatusLabel(current_score, baseline_score),
      source: metricsNorm ? "feature_snapshot" : "fallback",
    });
  }

  return items;
}

/**
 * 비교 카드 4개 결과를 바탕으로 요약 문장 3개 생성.
 * 실제 비교 결과 기반 문장만 사용.
 */
export function buildChannelDnaSummaries(
  compareItems: ChannelDnaCompareItem[]
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
