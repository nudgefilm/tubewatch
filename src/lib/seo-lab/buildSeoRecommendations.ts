import type { InternalChannelDnaSummaryVm } from "@/lib/channel-dna/internalChannelDnaSummary";
import type { SeoStrategyItemVm } from "@/lib/seo-lab/seoLabStrategyTypes";
import type {
  SeoStrategySignalRecord,
  SeoStrategySignalsPayload,
} from "@/lib/seo-lab/buildSeoStrategySignals";
import { makeDiagnosticLabel } from "@/lib/utils/labelUtils";

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
  bench: InternalChannelDnaSummaryVm,
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
  bench: InternalChannelDnaSummaryVm,
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
          "이 포맷에 맞게 제목 앞부분의 정보 밀도를 조정하세요. 핵심 주제가 첫 한 줄에 압축되면 클릭 후 이탈이 줄어듭니다. 지금 이 조합으로 다음 영상 키워드를 구성하세요.",
        signalSource: formatRec.sourceLabel,
        placement: "제목 앞 배치",
      }
    );
    dedupePush(
      titlePatterns,
      sharedTitleSeen,
      {
        id: nextRecId("tp"),
        title: "포맷에 맞는 ‘첫 한 줄’ 정보 구조",
        shortReason:
          "핵심 주제를 앞쪽에 두고 부가 수식어는 뒤로 이동하세요. 지금 표본 제목 3개를 골라 이 패턴으로 바로 수정해 보세요.",
        signalSource: formatRec.sourceLabel,
        placement: "제목 구조 적용",
      }
    );
  }

  const topLines = bench.topPatternSignals.slice(0, 2);
  for (let i = 0; i < topLines.length; i += 1) {
    const line = topLines[i]?.trim();
    if (!line) continue;
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: makeDiagnosticLabel(line),
      shortReason:
        `${line} — 이 패턴이 채널에서 반복적으로 성과를 내고 있습니다. 다음 영상 제목에서 이 축의 언어를 앞부분에 배치하세요.`,
      signalSource: "베이스 강점·패턴",
      placement: i === 0 ? "제목 앞 배치" : "태그 추가",
    });
  }

  if (records.some((r) => r.summaryLine.includes("repeated_topic_pattern"))) {
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: "시리즈·반복 주제를 드러내는 접두 키워드",
      shortReason:
        "주제 반복 패턴이 감지되었습니다. 회차·파트 접두어를 고정하면 시청자가 연속성을 바로 인식합니다. 지금 시리즈 제목 정책을 만드세요.",
      signalSource: "스냅샷 패턴",
      placement: "제목 접두어 고정",
    });
  }

  const brk = records.find((r) => r.dimension === "concentration");
  if (brk && bench.breakoutDependencyLevel === "high") {
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: "히트 편과 비히트 편을 가르는 주제·형식 표현",
      shortReason:
        "소수 영상에 조회가 집중되어 있습니다. 히트 편 톤만 반복하기보다, 다음 영상에서 다른 주제 축을 제목 앞에 배치해 분산 실험을 하세요.",
      signalSource: brk.sourceLabel,
      placement: "제목 앞 주제 구분",
    });
  }

  const spr = records.find((r) => r.dimension === "spread");
  if (spr && bench.performanceSpreadLevel === "high") {
    dedupePush(keywordAngles, sharedTitleSeen, {
      id: nextRecId("kw"),
      title: "편차가 큰 표본 — 상위 영상의 언어 구조를 지금 분석하세요",
      shortReason:
        "조회 편차가 큽니다. 상위 영상의 제목 구조를 하위 영상과 비교하고, 반응 좋았던 어휘를 다음 영상 앞부분에 적용하세요.",
      signalSource: spr.sourceLabel,
      placement: "제목 앞 배치",
    });
  }

  const upl = records.find((r) => r.dimension === "cadence");
  if (upl && bench.uploadConsistencyLevel === "low") {
    dedupePush(titlePatterns, sharedTitleSeen, {
      id: nextRecId("tp"),
      title: "발행 리듬이 보이는 제목 표기(회차·주기)",
      shortReason:
        "업로드 간격이 불규칙합니다. 제목에 회차·파트 표기를 고정하면 구독자가 다음 편을 기다리게 됩니다. 지금 시리즈 표기 정책을 만드세요.",
      signalSource: upl.sourceLabel,
      placement: "제목 회차 표기",
    });
  }

  if (brk && bench.top3Share != null && bench.top3Share >= 0.75) {
    dedupePush(titlePatterns, sharedTitleSeen, {
      id: nextRecId("tp"),
      title: "첫 구절에서 주제·포맷 구분",
      shortReason:
        "상위 영상에 조회가 집중됩니다. 제목 첫 구절에서 편마다 주제 차이가 드러나게 바꾸면 비히트 편의 클릭률이 올라갑니다. 지금 표본 제목을 편집하세요.",
      signalSource: "채널 DNA·조회 분포",
      placement: "제목 구조 적용",
    });
  }

  const weakForAvoid = bench.weakPatternSignals.slice(0, 4);
  for (const w of weakForAvoid) {
    const t = w.trim();
    if (!t) continue;
    dedupePush(avoidAngles, seenA, {
      id: nextRecId("av"),
      title: makeDiagnosticLabel(t),
      shortReason:
        `${t} — 이 패턴이 제목·태그에 반복되면 채널 개선 여지가 줄어듭니다. 이 톤 대신 강점 패턴의 언어로 대체하세요.`,
      signalSource: "베이스 주의·병목",
    });
  }

  if (records.some((r) => r.summaryLine.includes("low_tag_usage"))) {
    dedupePush(avoidAngles, seenA, {
      id: nextRecId("av"),
      title: "태그 없이 제목만으로 모든 주제를 흡수하려는 접근",
      shortReason:
        "태그 없이 제목만으로 모든 주제를 담으면 알고리즘 인식이 약해집니다. 제목 키워드와 태그를 일치시키는 구조로 지금 전환하세요.",
      signalSource: "스냅샷 패턴",
    });
  }

  if (spr && bench.performanceSpreadLevel === "high") {
    dedupePush(avoidAngles, seenA, {
      id: nextRecId("av"),
      title: "표본 내 ‘한 방’ 히트 문법만 복제하는 제목",
      shortReason:
        "편차가 큰 상태에서 히트 편 문법만 복제하면 다른 편에서 역효과가 납니다. 표본 전체와 일관된 구조를 먼저 만드세요.",
      signalSource: spr.sourceLabel,
    });
  }

  if (keywordAngles.length === 0 && records.length > 0) {
    for (const r of records) {
      if (keywordAngles.length >= caps.kw) break;
      dedupePush(keywordAngles, sharedTitleSeen, {
        id: nextRecId("kw"),
        title: makeDiagnosticLabel(r.summaryLine),
        shortReason: r.summaryLine
          ? `${r.summaryLine} — ${r.forSeo} 지금 이 방향으로 다음 영상 키워드를 구성하세요.`
          : `${r.forSeo} 지금 적용하세요.`,
        signalSource: r.sourceLabel,
        placement: keywordAngles.length === 0 ? "제목 앞 배치" : keywordAngles.length === 1 ? "태그 추가" : "설명란 첫 줄",
      });
    }
  }

  if (titlePatterns.length === 0 && records.length > 0) {
    for (const r of records) {
      if (r.dimension === "risk") continue;
      if (titlePatterns.length >= caps.tp) break;
      dedupePush(titlePatterns, sharedTitleSeen, {
        id: nextRecId("tp"),
        title: makeDiagnosticLabel(r.summaryLine),
        shortReason: r.summaryLine
          ? `${r.summaryLine} — ${r.forSeo} 지금 바로 제목에 적용하세요.`
          : `${r.forSeo} 지금 적용하세요.`,
        signalSource: r.sourceLabel,
        placement: "제목 구조 적용",
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
      "표본이 적어 관찰 가능한 신호 중심으로 방향을 제시합니다. 제목·태그·포맷 중 지금 바로 바꿀 수 있는 한 가지부터 실행하세요.";
  } else if (!hasEnoughSeoSignal) {
    summary =
      "내부 신호가 제한적입니다. 아래 전략은 이 채널 표본 구조에 맞는 방향이며, 지금 바로 제목 앞부분 키워드 배치부터 시작하세요.";
  } else {
    summary =
      "채널 구조에서 읽어낸 알고리즘 침투 전략입니다. 아래 키워드 조합과 제목 패턴을 지금 다음 영상에 적용하세요.";
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
