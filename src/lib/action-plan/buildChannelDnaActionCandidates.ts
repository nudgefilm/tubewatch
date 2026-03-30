import type { ChannelDnaSignalsForActionPlan } from "@/lib/channel-dna/channelDnaSignalsForActionPlan";

const CONSERVATIVE_EFFECT =
  "2~3회 업로드 후 조회·반응 변화를 직접 측정하면, 어느 요소가 실제로 작동하는지 확인할 수 있습니다.";

/** 채널 DNA 내부 요약 + 정렬 메타(티어 오름차순 → 카드 앞쪽) */
export type ChannelDnaActionCandidate = {
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

const SECTION_WHY_NEEDED: Record<keyof SectionScoresInput, string> = {
  channelActivity:
    "업로드·활동 구간 점수가 기준 이하로 측정되었습니다. 활동 빈도가 낮으면 알고리즘 노출 기회가 줄어들고, 신규 구독자 유입 속도도 느려집니다. 지금 업로드 계획을 점검하세요.",
  audienceResponse:
    "조회·반응 구간 점수가 기준 이하로 측정되었습니다. 클릭률·시청 유지율·좋아요 등 반응 신호가 약하면 알고리즘 추천 범위가 좁아집니다. 제목·썸네일·첫 30초를 점검하세요.",
  contentStructure:
    "콘텐츠·구조 구간 점수가 기준 이하입니다. 영상 길이·제목 형식·주제 일관성에 비규칙성이 있으면 채널 정체성이 흐려집니다. 포맷 표준화를 시작하세요.",
  seoOptimization:
    "메타·발견성 구간 점수가 기준 이하입니다. 태그·설명문·제목의 키워드 구성이 약하면 검색 및 외부 유입이 줄어듭니다. 핵심 키워드 배치부터 수정하세요.",
  growthMomentum:
    "성장 신호 구간 점수가 기준 이하입니다. 구독자 증가·조회 상승 추세가 약하면 채널이 정체 구간에 있을 가능성이 높습니다. 고성과 포맷을 다시 재현해 보세요.",
};

const SECTION_EXECUTION_HINT: Record<keyof SectionScoresInput, string> = {
  channelActivity:
    "/analysis 구간 카드에서 업로드 빈도·패턴 데이터를 확인하고, 개선 가능한 한 가지 목표만 먼저 설정하세요.",
  audienceResponse:
    "/analysis 구간 카드에서 반응 데이터를 확인하고, 제목·썸네일·첫 30초 중 개선할 요소 하나를 골라 다음 영상에 반영하세요.",
  contentStructure:
    "/analysis 구간 카드와 표본을 함께 확인하고, 포맷이나 제목 구조 중 표준화할 수 있는 한 가지 패턴을 정하세요.",
  seoOptimization:
    "/analysis 구간 카드에서 SEO 관련 신호를 확인하고, 다음 영상부터 제목 첫 15자에 핵심 키워드를 배치하는 습관을 적용하세요.",
  growthMomentum:
    "/analysis 구간 카드에서 성장 패턴 데이터를 확인하고, 과거 고성과 영상의 주제·포맷을 한 편 재현해 보세요.",
};

function pct1(x: number): string {
  return (x * 100).toFixed(1);
}

/** 히트 근거: 수치 1문장 (긴 fallback은 붙이지 않음) */
function formatHitEvidence(s: ChannelDnaSignalsForActionPlan): string {
  if (s.top3Share != null) {
    return `상위 3개 조회 합 비중이 약 ${pct1(s.top3Share)}%로 높게 나타났습니다.`;
  }
  if (s.topPerformerShare != null) {
    return `상위 영상 1개가 전체 조회의 약 ${pct1(s.topPerformerShare)}%를 차지하고 있습니다.`;
  }
  return "채널 DNA에서 히트 의존도가 높게 기록되었습니다.";
}

function applyChannelDnaSampleLimits(
  rows: ChannelDnaActionCandidate[],
  recentVideosUsed: number
): ChannelDnaActionCandidate[] {
  let r = rows;
  if (recentVideosUsed < 3) {
    r = r.filter((x) => x.id === "channel-dna-upload-rhythm");
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
 * 채널 DNA 카드가 같은 축·유사 제안을 덮을 때 메트릭 카드 제거 (채널 DNA 우선).
 */
export function filterMetricActionsSupersededByChannelDna<
  T extends { id: string },
>(metricActions: readonly T[], channelDnaRows: readonly ChannelDnaActionCandidate[]): T[] {
  const dnaIds = new Set(channelDnaRows.map((r) => r.id));
  return metricActions.filter((m) => !metricSupersededByChannelDna(m.id, dnaIds));
}

function metricSupersededByChannelDna(metricId: string, dnaIds: Set<string>): boolean {
  if (
    dnaIds.has("channel-dna-upload-rhythm") ||
    dnaIds.has("channel-dna-section-channelActivity")
  ) {
    if (metricId === "metric-activity-uploads" || metricId === "metric-activity-interval") {
      return true;
    }
  }
  if (dnaIds.has("channel-dna-hit-concentration") || dnaIds.has("channel-dna-spread-repro")) {
    if (metricId === "metric-growth-median") {
      return true;
    }
  }
  if (dnaIds.has("channel-dna-section-audienceResponse")) {
    if (metricId === "metric-audience-like") {
      return true;
    }
  }
  if (dnaIds.has("channel-dna-section-contentStructure")) {
    if (metricId === "metric-structure-title" || metricId === "metric-duration") {
      return true;
    }
  }
  if (dnaIds.has("channel-dna-section-seoOptimization")) {
    if (metricId === "metric-tags") {
      return true;
    }
  }
  if (dnaIds.has("channel-dna-section-contentStructure") && metricId === "metric-tags") {
    return true;
  }
  return false;
}

/**
 * 채널 DNA 스냅샷에서만 계산된 신호로 룰 기반 액션 후보를 만듭니다.
 * 구간 카드는 메트릭과 중복될 수 있으나 우선순위 병합 단계에서 메트릭이 걸러집니다.
 */
export function buildChannelDnaActionCandidates(
  bench: ChannelDnaSignalsForActionPlan,
  sections: SectionScoresInput | null
): ChannelDnaActionCandidate[] {
  const out: ChannelDnaActionCandidate[] = [];
  const hasSample = bench.recentVideosUsed > 0;

  if (hasSample && bench.breakoutDependencyLevel === "high") {
    const formatTail =
      bench.dominantFormat != null ? ` 추정 포맷: ${bench.dominantFormat}.` : "";
    out.push({
      id: "channel-dna-hit-concentration",
      title: "조회 집중 완화를 위한 포맷과 주제 분산 검토",
      whyNeeded: `${formatHitEvidence(bench)} 성과 대부분이 소수 영상에 집중되어 있어, 히트 영상이 없을 때 채널 전체 조회가 급감할 수 있습니다.${formatTail} 지금 다른 주제·포맷으로 한 편을 실험하세요.`.trim(),
      expectedEffect: "소수 실험 후 중간 성과 영상이 늘어나면, 히트 의존 없이도 안정적인 조회 구조로 이동하는 신호입니다.",
      difficulty: "medium",
      executionHint:
        "상위 영상과 다른 주제나 포맷으로 1편만 먼저 실험하고, /analysis 표본과 조회수 차이를 기록하세요.",
      sortTier: 1,
      sortOrder: 0,
    });
  }

  if (hasSample && bench.performanceSpreadLevel === "high") {
    const formatTail =
      bench.dominantFormat != null ? ` 추정 포맷 ${bench.dominantFormat}.` : "";
    out.push({
      id: "channel-dna-spread-repro",
      title: "재현 가능한 포맷과 패턴 정리",
      whyNeeded: `조회수 편차가 크게 측정되었습니다.${formatTail ? ` ${formatTail}` : ""} 편차가 크면 어느 요소가 성과를 만드는지 파악하기 어려워져, 좋은 영상을 반복 제작하기 힘들어집니다. 지금 상·하위 영상을 비교해 패턴을 찾으세요.`.trim(),
      expectedEffect: "반복 실험을 3~4회 진행하면, 재현 가능한 포맷 패턴을 도출할 수 있습니다.",
      difficulty: "medium",
      executionHint:
        "상위·하위 영상 각 2편의 제목·썸네일·첫 30초를 표로 비교하고, 다음 업로드에서 한 가지 요소만 맞춰 보세요.",
      sortTier: 2,
      sortOrder: 0,
    });
  }

  if (bench.uploadConsistencyLevel === "low") {
    out.push({
      id: "channel-dna-upload-rhythm",
      title: "발행 리듬과 간격 안정화 점검",
      whyNeeded:
        "업로드 일관성이 낮음으로 기록되었습니다. 간격이 불규칙하면 구독자 기대 주기가 형성되지 않고, 알고리즘이 채널을 비활성으로 판단할 수 있습니다. 지금 한 달 업로드 일정을 달력에 배치하세요.",
      expectedEffect: "4주 이상 일정한 간격으로 업로드하면, 알고리즘이 채널을 활성 상태로 인식하기 시작합니다.",
      difficulty: "low",
      executionHint:
        "한 달치 공개 예정일을 달력에 먼저 배치하고, 병목이 기획·촬영·편집 중 어디서 발생하는지 단계별로 적어 보세요.",
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
        id: `channel-dna-section-${k}`,
        title: `${SECTION_LABELS[k]} 구간 집중 보완`,
        whyNeeded: SECTION_WHY_NEEDED[k],
        expectedEffect: CONSERVATIVE_EFFECT,
        difficulty: k === "growthMomentum" ? "high" : "medium",
        executionHint: SECTION_EXECUTION_HINT[k],
        sortTier: 4,
        sortOrder: ord,
      });
      ord += 1;
    }
  }

  if (bench.topPatternSignals.length > 0) {
    const quoted = bench.topPatternSignals.slice(0, 2).join(" · ");
    out.push({
      id: "channel-dna-strength-extend",
      title: "반복 확인된 강점 패턴 유지와 확장",
      whyNeeded: `강점 패턴 — ${quoted} — 이 반복 확인되었습니다. 이 패턴이 성과의 핵심이며, 흔들리면 기존 시청자 반응도 낮아질 수 있습니다. 지금 이 패턴을 명문화하세요.`,
      expectedEffect: "강점 패턴을 유지하면서 점진적으로 확장하면, 기존 시청자를 유지하며 새로운 반응 구간을 열 수 있습니다.",
      difficulty: "low",
      executionHint:
        "다음 1~2편에서 이 톤과 포맷을 유지하되, 한 가지 요소만 실험적으로 변경해 차이를 비교하세요.",
      sortTier: 5,
      sortOrder: 0,
    });
  }

  return applyChannelDnaSampleLimits(out, bench.recentVideosUsed);
}
