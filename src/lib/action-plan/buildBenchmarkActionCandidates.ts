import type { BenchmarkSignalsForActionPlan } from "@/lib/benchmark/benchmarkSignalsForActionPlan";

const CONSERVATIVE_EFFECT =
  "지표 개선을 보장하지 않으며, 소규모 실험 후 변화를 직접 확인하는 방식이 안전합니다.";

/** 벤치마크 내부 요약 + 정렬 메타(티어 오름차순 → 카드 앞쪽) */
export type BenchmarkActionCandidate = {
  readonly id: string;
  readonly title: string;
  readonly whyNeeded: string;
  readonly expectedEffect: string;
  readonly difficulty: "low" | "medium" | "high";
  readonly executionHint: string;
  readonly sortTier: number;
  readonly sortOrder: number;
};

type SectionScoresInput = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
};

const SECTION_LABELS: Record<keyof SectionScoresInput, string> = {
  channelActivity: "업로드·활동",
  audienceResponse: "조회·반응",
  contentStructure: "콘텐츠·구조",
  seoOptimization: "메타·발견성",
  growthMomentum: "성장 신호",
};

const SECTION_THRESHOLD = 55;

function pct1(x: number): string {
  return (x * 100).toFixed(1);
}

/** 히트 근거: 수치 1문장 (긴 fallback은 붙이지 않음) */
function formatHitEvidence(s: BenchmarkSignalsForActionPlan): string {
  if (s.top3Share != null) {
    return `상위 3개 조회 합 비중이 약 ${pct1(s.top3Share)}%로 높게 나타났습니다.`;
  }
  if (s.topPerformerShare != null) {
    return `표본이 3개 미만이라 상위 1개 조회 비중 약 ${pct1(s.topPerformerShare)}%만 산출되었습니다.`;
  }
  return "벤치마크에서 히트 의존도가 높게 기록되었습니다.";
}

function applyBenchmarkSampleLimits(
  rows: BenchmarkActionCandidate[],
  recentVideosUsed: number
): BenchmarkActionCandidate[] {
  let r = rows;
  if (recentVideosUsed < 3) {
    r = r.filter((x) => x.id === "benchmark-upload-rhythm");
  }
  const sorted = [...r].sort(
    (a, b) => a.sortTier - b.sortTier || a.sortOrder - b.sortOrder
  );
  if (recentVideosUsed <= 5) {
    return sorted.slice(0, 3);
  }
  return sorted;
}

/**
 * 벤치마크 카드가 같은 축·유사 제안을 덮을 때 메트릭 카드 제거 (벤치마크 우선).
 */
export function filterMetricActionsSupersededByBenchmark<
  T extends { id: string },
>(metricActions: readonly T[], benchmarkRows: readonly BenchmarkActionCandidate[]): T[] {
  const benchIds = new Set(benchmarkRows.map((r) => r.id));
  return metricActions.filter((m) => !metricSupersededByBenchmark(m.id, benchIds));
}

function metricSupersededByBenchmark(metricId: string, benchIds: Set<string>): boolean {
  if (
    benchIds.has("benchmark-upload-rhythm") ||
    benchIds.has("benchmark-section-channelActivity")
  ) {
    if (metricId === "metric-activity-uploads" || metricId === "metric-activity-interval") {
      return true;
    }
  }
  if (benchIds.has("benchmark-hit-concentration") || benchIds.has("benchmark-spread-repro")) {
    if (metricId === "metric-growth-median") {
      return true;
    }
  }
  if (benchIds.has("benchmark-section-audienceResponse")) {
    if (metricId === "metric-audience-like") {
      return true;
    }
  }
  if (benchIds.has("benchmark-section-contentStructure")) {
    if (metricId === "metric-structure-title" || metricId === "metric-duration") {
      return true;
    }
  }
  if (benchIds.has("benchmark-section-seoOptimization")) {
    if (metricId === "metric-tags") {
      return true;
    }
  }
  if (benchIds.has("benchmark-section-contentStructure") && metricId === "metric-tags") {
    return true;
  }
  return false;
}

/**
 * 벤치마크 스냅샷에서만 계산된 신호로 룰 기반 액션 후보를 만듭니다.
 * 구간 카드는 메트릭과 중복될 수 있으나 우선순위 병합 단계에서 메트릭이 걸러집니다.
 */
export function buildBenchmarkActionCandidates(
  bench: BenchmarkSignalsForActionPlan,
  sections: SectionScoresInput | null
): BenchmarkActionCandidate[] {
  const out: BenchmarkActionCandidate[] = [];
  const hasSample = bench.recentVideosUsed > 0;

  if (hasSample && bench.breakoutDependencyLevel === "high") {
    const formatTail =
      bench.dominantFormat != null ? ` 추정 포맷: ${bench.dominantFormat}.` : "";
    out.push({
      id: "benchmark-hit-concentration",
      title: "조회 집중 완화를 위한 포맷·주제 분산 검토",
      whyNeeded: `${formatHitEvidence(bench)} 성과가 일부 콘텐츠에 집중되어 있습니다.${formatTail}`.trim(),
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "medium",
      executionHint:
        "짧은 길이·다른 주제 소수 편을 /analysis 표본과 비교해 한 번에 하나만 시험하고 결과만 기록하세요.",
      sortTier: 1,
      sortOrder: 0,
    });
  }

  if (hasSample && bench.performanceSpreadLevel === "high") {
    const formatTail =
      bench.dominantFormat != null ? ` 추정 포맷 ${bench.dominantFormat}.` : "";
    out.push({
      id: "benchmark-spread-repro",
      title: "표본 내 재현 가능한 포맷·패턴 정리",
      whyNeeded: `표본 조회 편차가 크게(높음) 관측되었습니다.${formatTail ? ` ${formatTail}` : ""}`.trim(),
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "medium",
      executionHint:
        "상·하위 표본 몇 개의 제목·썸네일·첫 30초만 표로 적고 다음 업로드 1건에 한 요소만 맞춰 보세요.",
      sortTier: 2,
      sortOrder: 0,
    });
  }

  if (bench.uploadConsistencyLevel === "low") {
    out.push({
      id: "benchmark-upload-rhythm",
      title: "발행 리듬·간격 안정화 점검",
      whyNeeded:
        "벤치마크에서 업로드 일관성이 낮음으로 기록되었습니다. 공개 간격 변동이 큰 편으로 읽힙니다.",
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "한 달치 공개일을 캘린더에 옮기고 병목이 기획·촬영·편집 중 어디인지 한 줄로만 적어 보세요.",
      sortTier: 3,
      sortOrder: 0,
    });
  }

  if (sections) {
    const keys = Object.keys(SECTION_LABELS) as (keyof SectionScoresInput)[];
    let ord = 0;
    for (const k of keys) {
      if (sections[k] >= SECTION_THRESHOLD) {
        continue;
      }
      out.push({
        id: `benchmark-section-${k}`,
        title: `${SECTION_LABELS[k]} 구간 보완 점검`,
        whyNeeded: `${SECTION_LABELS[k]} 구간 점수 ${Math.round(sections[k])}점입니다. 저장 스냅샷과 /channel-dna가 같은 값을 씁니다.`,
        expectedEffect: CONSERVATIVE_EFFECT,
        difficulty: k === "growthMomentum" ? "high" : "medium",
        executionHint:
          "/analysis 구간 카드와 표본을 함께 보고 확인 가능한 가설 하나만 정하세요.",
        sortTier: 4,
        sortOrder: ord,
      });
      ord += 1;
    }
  }

  if (bench.topPatternSignals.length > 0) {
    const quoted = bench.topPatternSignals.slice(0, 2).join(" · ");
    out.push({
      id: "benchmark-strength-extend",
      title: "베이스에서 반복된 문장 유지·소폭 확장",
      whyNeeded: `베이스 진단에서 반복된 문장: ${quoted}`,
      expectedEffect: CONSERVATIVE_EFFECT,
      difficulty: "low",
      executionHint:
        "다음 1~2편에서 동일 톤 유지와 한 가지 변경만 비교할 수 있게 기록하세요.",
      sortTier: 5,
      sortOrder: 0,
    });
  }

  return applyBenchmarkSampleLimits(out, bench.recentVideosUsed);
}
