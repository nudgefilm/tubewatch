import type {
  TrendSignalRecord,
  TrendSignalsBundle,
} from "@/lib/next-trend/buildTrendSignals";

export type TrendItemVm = {
  id: string;
  title: string;
  shortReason: string;
  evidenceSource: string;
};

export type TrendInsightsBundle = {
  trendSummary: string;
  detectedPatterns: TrendItemVm[];
  repeatedTopics: TrendItemVm[];
  formatChanges: TrendItemVm[];
  evidenceNotes: string[];
  hasEnoughTrendSignal: boolean;
};

function toVm(r: TrendSignalRecord): TrendItemVm {
  return {
    id: r.id,
    title: r.headline,
    shortReason: r.detail,
    evidenceSource: r.evidenceSource,
  };
}

function normTitle(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 88);
}

function dedupePush(
  out: TrendItemVm[],
  seen: Set<string>,
  item: TrendItemVm,
  max: number
): void {
  if (out.length >= max) return;
  const k = normTitle(item.title);
  if (!k || seen.has(k)) return;
  seen.add(k);
  out.push(item);
}

function maxPerCategory(n: number, hasEnough: boolean): number {
  if (n < 3) return 1;
  if (!hasEnough) return 2;
  return 4;
}

function signalOrder(s: TrendSignalRecord["strength"]): number {
  if (s === "clear") return 0;
  if (s === "medium") return 1;
  return 2;
}

/**
 * 신호 레코드를 UI 섹션별 항목으로 나누고 요약·플래그를 만든다.
 */
export function buildTrendInsights(bundle: TrendSignalsBundle): TrendInsightsBundle {
  const { records, evidenceNotes, recentVideosUsed } = bundle;

  const hasClear = records.some((r) => r.strength === "clear");
  const hasMedium = records.some((r) => r.strength === "medium");
  const hasEnoughTrendSignal =
    recentVideosUsed >= 3 && (hasClear || hasMedium);

  let trendSummary: string;
  if (recentVideosUsed < 3) {
    trendSummary =
      "최근 데이터가 제한적이어서 일부 흐름만 확인됩니다. 아래는 저장된 표본 범위 안에서만 해석됩니다.";
  } else if (hasClear) {
    trendSummary =
      "최근 영상에서 특정 패턴 변화가 일부 감지됩니다. 예측이나 외부 트렌드가 아니라 표본 내부 비교 결과입니다.";
  } else if (hasMedium || records.length > 0) {
    trendSummary =
      "뚜렷한 변화보다는 기존 패턴이 유지되는 경향이 있습니다. 일부 지표에서만 작은 차이가 보일 수 있습니다.";
  } else {
    trendSummary =
      "뚜렷한 변화보다는 기존 패턴이 유지되는 경향이 있습니다. 표본에서 추가 신호를 만들지 않았습니다.";
  }

  const maxR = maxPerCategory(recentVideosUsed, hasEnoughTrendSignal);
  const maxF = maxPerCategory(recentVideosUsed, hasEnoughTrendSignal);
  const maxD = maxPerCategory(recentVideosUsed, hasEnoughTrendSignal);

  const repeatedTopics: TrendItemVm[] = [];
  const formatChanges: TrendItemVm[] = [];
  const detectedPatterns: TrendItemVm[] = [];

  const seenR = new Set<string>();
  const seenF = new Set<string>();
  const seenD = new Set<string>();

  const sorted = [...records].sort(
    (a, b) => signalOrder(a.strength) - signalOrder(b.strength)
  );

  for (const r of sorted) {
    const vm = toVm(r);
    if (
      r.category === "repeat" ||
      (r.category === "snapshot_pattern" && r.headline.includes("주제·포맷 반복"))
    ) {
      dedupePush(repeatedTopics, seenR, vm, maxR);
    } else if (r.category === "format" || r.category === "rhythm") {
      dedupePush(formatChanges, seenF, vm, maxF);
    } else if (r.category === "view" || r.category === "snapshot_pattern") {
      dedupePush(detectedPatterns, seenD, vm, maxD);
    }
  }

  return {
    trendSummary,
    detectedPatterns,
    repeatedTopics,
    formatChanges,
    evidenceNotes,
    hasEnoughTrendSignal,
  };
}
