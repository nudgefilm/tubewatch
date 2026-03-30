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
      "데이터가 적어 일부 신호만 확인됩니다. 기존 포맷을 반복하는 전략으로 지금 시작하세요.";
  } else if (hasClear) {
    trendSummary =
      "최근 영상에서 명확한 성과 패턴이 감지됩니다. 아래 후보 방향으로 다음 영상을 기획하세요.";
  } else if (hasMedium || records.length > 0) {
    trendSummary =
      "기존 패턴이 유지되고 있습니다. 성과를 낸 포맷을 지금 반복 제작하세요.";
  } else {
    trendSummary =
      "뚜렷한 신호가 없습니다. 기존 포맷을 유지하며 1편 실험하세요.";
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
