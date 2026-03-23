import type { InternalBenchmarkSummaryVm } from "@/lib/benchmark/internalBenchmarkSummary";
import type { SeoStrategyItemVm } from "@/lib/seo-lab/seoLabStrategyTypes";
import type {
  SeoStrategySignalRecord,
  SeoStrategySignalsPayload,
} from "@/lib/seo-lab/buildSeoStrategySignals";

export type SeoLabStrategySectionVm = {
  seoStrategySummary: string;
  recommendedKeywordAngles: SeoStrategyItemVm[];
  recommendedTitlePatterns: SeoStrategyItemVm[];
  avoidKeywordAngles: SeoStrategyItemVm[];
  evidenceNotes: string[];
  hasEnoughSeoSignal: boolean;
};

function normalizeKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function dedupePush(
  out: SeoStrategyItemVm[],
  seen: Set<string>,
  item: SeoStrategyItemVm
): void {
  const k = normalizeKey(item.title);
  if (!k || seen.has(k)) return;
  seen.add(k);
  out.push(item);
}

function computeHasEnoughSeoSignal(
  bench: InternalBenchmarkSummaryVm,
  records: readonly SeoStrategySignalRecord[]
): boolean {
  const n = bench.recentVideosUsed;
  const structuralDims = [
    "format",
    "repeat_win",
    "concentration",
    "spread",
    "cadence",
  ] as const;
  const structural = records.filter((r) =>
    (structuralDims as readonly string[]).includes(r.dimension)
  );
  if (n >= 5) {
    return structural.length >= 1 || bench.topPatternSignals.length >= 1;
  }
  if (n >= 3) {
    return (
      bench.dominantFormat != null ||
      bench.topPatternSignals.length >= 1 ||
      structural.length >= 1
    );
  }
  return false;
}

function capForSample(
  hasEnough: boolean,
  recentVideosUsed: number
): { kw: number; tp: number; av: number } {
  if (recentVideosUsed < 3) {
    return { kw: 2, tp: 2, av: 2 };
  }
  if (!hasEnough) {
    return { kw: 3, tp: 3, av: 3 };
  }
  return { kw: 5, tp: 5, av: 4 };
}

let recId = 0;
function nextRecId(prefix: string): string {
  recId += 1;
  return `seo-rec-${prefix}-${recId}`;
}

/**
 * 번역된 신호에서 채널 맞춤 추천 항목을 생성한다.
 */
export function buildSeoRecommendations(
  bench: InternalBenchmarkSummaryVm,
  payload: SeoStrategySignalsPayload
): SeoLabStrategySectionVm {
  recId = 0;
  const { records, rawEvidenceLines } = payload;
  const hasEnoughSeoSignal = computeHasEnoughSeoSignal(bench, records);
  const caps = capForSample(hasEnoughSeoSignal, bench.recentVideosUsed);

  const keywordAngles: SeoStrategyItemVm[] = [];
  const titlePatterns: SeoStrategyItemVm[] = [];
  const avoidAngles: SeoStrategyItemVm[] = [];
  /** 키워드 방향·제목 패턴 간 제목 문구 중복 방지 */
  const sharedTitleSeen = new Set<string>();
  const seenA = new Set<string>();

  const formatRec = records.find((r) => r.dimension === "format");
  if (formatRec && bench.dominantFormat) {
    dedupePush(
      keywordAngles,
      sharedTitleSeen,
      {
        id: nextRecId("kw"),
        title: `${bench.dominantFormat}에 맞춘 주제·형식 표현`,
        shortReason:
          "표본 길이로 추정한 포맷과 제목·설명의 정보 밀도가 맞을 때, 채널 내 반복 시청 맥락과 어긋나지 않기 쉽습니다. 검색량이 아니라 구조 적합성 관점입니다.",
        signalSource: formatRec.sourceLabel,
      }
    );
    dedupePush(
      titlePatterns,
      sharedTitleSeen,
      {
        id: nextRecId("tp"),
        title: "포맷에 맞는 ‘첫 한 줄’ 정보 구조",
        shortReason:
          "이 채널에서 추정된 포맷에 맞게, 핵심 주제를 앞쪽에 두고 부가 수식어는 뒤로 미루는 패턴을 표본 제목끼리 맞춰 보세요.",
        signalSource: formatRec.sourceLabel,
      }
    );
  }

  const topLines = bench.topPatternSignals.slice(0, 2);
  for (let i = 0; i < topLines.length; i += 1) {
    const line = topLines[i]?.trim();
    if (!line) continue;
    const short = line.length > 48 ? `${line.slice(0, 45)}…` : line;
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: `강점 신호와 맞닿는 주제 언어: ${short}`,
      shortReason:
        "베이스 진단에서 반복 언급된 내용입니다. 제목 앞부분의 단어 선택이 이 축과 겹치면 채널 안에서 메시지가 한 줄로 읽히기 쉽습니다.",
      signalSource: "베이스 강점·패턴",
    });
  }

  if (records.some((r) => r.summaryLine.includes("repeated_topic_pattern"))) {
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: "시리즈·반복 주제를 드러내는 접두 키워드",
      shortReason:
        "스냅샷에 주제 반복 패턴이 있습니다. 의도된 시리즈라면 회차·파트·공통 접두를 제목 정책으로 고정하는 편이 구조 파악에 유리합니다.",
      signalSource: "스냅샷 패턴",
    });
  }

  const brk = records.find((r) => r.dimension === "concentration");
  if (brk && bench.breakoutDependencyLevel === "high") {
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: "히트 편과 비히트 편을 가르는 주제·형식 표현",
      shortReason:
        "표본에서 조회가 소수 영상에 몰린 신호가 큽니다. ‘대표 편’ 톤만 반복하기보다, 편마다 주제 축이 제목에서 구분되는지 점검하세요.",
      signalSource: brk.sourceLabel,
    });
  }

  const spr = records.find((r) => r.dimension === "spread");
  if (spr && bench.performanceSpreadLevel === "high") {
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: "편차가 큰 표본 — 상대적으로 반응 좋았던 축의 언어 유지",
      shortReason:
        "같은 채널 안에서도 조회 격차가 큽니다. 상대적으로 반응이 나았던 편의 제목 구조·어휘를 표본 범위에서만 비교해 보존할지 정하세요.",
      signalSource: spr.sourceLabel,
    });
  }

  const upl = records.find((r) => r.dimension === "cadence");
  if (upl && bench.uploadConsistencyLevel === "low") {
    dedupePush(titlePatterns, sharedTitleSeen, {
      id: nextRecId("tp"),
      title: "발행 리듬이 보이는 제목 표기(회차·주기)",
      shortReason:
        "업로드 간격 변동이 크게 기록되었습니다. 시청자가 기대하는 리듬을 제목·시리즈 표기로 보조할 수 있는지 확인하세요. 효과를 단정하지 않습니다.",
      signalSource: upl.sourceLabel,
    });
  }

  if (brk && bench.top3Share != null && bench.top3Share >= 0.75) {
    dedupePush(titlePatterns, sharedTitleSeen, {
      id: nextRecId("tp"),
      title: "첫 구절에서 주제·포맷 구분",
      shortReason:
        "상위 몇 편에 조회가 집중된 비중이 높게 나타났습니다. 제목 앞부분만으로 편이 구분되는지, 동일한 문구 반복이 없는지 살펴보세요.",
      signalSource: "벤치마크·조회 분포",
    });
  }

  const weakForAvoid = bench.weakPatternSignals.slice(0, 4);
  for (const w of weakForAvoid) {
    const t = w.trim();
    if (!t) continue;
    const title =
      t.length > 42 ? `주의로 기록된 접근 피하기: ${t.slice(0, 39)}…` : `주의로 기록된 접근 피하기: ${t}`;
    dedupePush(avoidAngles, seenA, {
      id: nextRecId("av"),
      title,
      shortReason:
        "베이스 진단의 주의·병목 문장과 같은 톤을 제목·태그에 반복하면, 채널 구조상 개선 여지가 줄어들 수 있습니다. 확정 진단은 아닙니다.",
      signalSource: "베이스 주의·병목",
    });
  }

  if (records.some((r) => r.summaryLine.includes("low_tag_usage"))) {
    dedupePush(avoidAngles, seenA, {
      id: nextRecId("av"),
      title: "태그 없이 제목만으로 모든 주제를 흡수하려는 접근",
      shortReason:
        "스냅샷에 태그 부족 패턴이 있습니다. 메타 일관성을 위해 주제 태그와 제목 앞단어를 맞추는 쪽이 이 채널 구조에 더 잘 맞을 수 있습니다.",
      signalSource: "스냅샷 패턴",
    });
  }

  if (spr && bench.performanceSpreadLevel === "high") {
    dedupePush(avoidAngles, seenA, {
      id: nextRecId("av"),
      title: "표본 내 ‘한 방’ 히트 문법만 복제하는 제목",
      shortReason:
        "편차가 큰 표본에서는 단일 히트 편의 문법이 다른 편에 그대로 맞지 않을 수 있습니다. 표본 전체와의 정합을 우선하세요.",
      signalSource: spr.sourceLabel,
    });
  }

  if (keywordAngles.length === 0 && records.length > 0) {
    for (const r of records) {
      if (keywordAngles.length >= caps.kw) break;
      const base =
        r.summaryLine.length > 56 ? `${r.summaryLine.slice(0, 53)}…` : r.summaryLine;
      dedupePush(keywordAngles, sharedTitleSeen, {
        id: nextRecId("kw"),
        title: `관찰 신호 기반 점검: ${base}`,
        shortReason: r.forSeo,
        signalSource: r.sourceLabel,
      });
    }
  }

  if (titlePatterns.length === 0 && records.length > 0) {
    for (const r of records) {
      if (r.dimension === "risk") continue;
      if (titlePatterns.length >= caps.tp) break;
      const base =
        r.summaryLine.length > 52 ? `${r.summaryLine.slice(0, 49)}…` : r.summaryLine;
      dedupePush(titlePatterns, sharedTitleSeen, {
        id: nextRecId("tp"),
        title: `제목 구조 점검: ${base}`,
        shortReason: r.forSeo,
        signalSource: r.sourceLabel,
      });
    }
  }

  const evidenceNotes = [...rawEvidenceLines];
  if (bench.dataSourceNote) {
    evidenceNotes.unshift(bench.dataSourceNote);
  }

  const sliceToCap = (
    arr: SeoStrategyItemVm[],
    max: number
  ): SeoStrategyItemVm[] => arr.slice(0, max);

  let summary: string;
  if (bench.recentVideosUsed < 3) {
    summary =
      "표본이 매우 적어 관찰 가능한 내부 신호 중심으로만 방향을 제안합니다. 검색량·순위 효과를 단정하지 않으며, /analysis·/channel-dna와 같은 저장 데이터 해석과 톤을 맞췄습니다.";
  } else if (!hasEnoughSeoSignal) {
    summary =
      "내부 신호가 제한적입니다. 아래는 이 채널 표본 구조에 맞는지 점검하는 용도이며, 범용 키워드 탐색이 아닙니다. 근거는 저장된 스냅샷·베이스 진단·구간 점수에 한정됩니다.";
  } else {
    summary =
      "이 페이지는 외부 검색량이 아니라, 저장된 분석·벤치마크에서 읽힌 채널 구조에 맞는 제목·키워드 방향을 제안합니다. Action Plan·벤치마크에서 쓰는 내부 해석과 같은 결을 유지했습니다.";
  }

  return {
    seoStrategySummary: summary,
    recommendedKeywordAngles: sliceToCap(keywordAngles, caps.kw),
    recommendedTitlePatterns: sliceToCap(titlePatterns, caps.tp),
    avoidKeywordAngles: sliceToCap(avoidAngles, caps.av),
    evidenceNotes: uniqueStrings(evidenceNotes).slice(0, 8),
    hasEnoughSeoSignal,
  };
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
