import type { ChannelDnaSignalsForActionPlan } from "@/lib/channel-dna/channelDnaSignalsForActionPlan";

const CONSERVATIVE_EFFECT =
  "소규모 실험으로 시청 지속시간과 CTR 변화를 직접 확인하면 재현 가능한 패턴을 좁혀나갈 수 있습니다.";

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
  /** 3단 변화 시나리오. "\n" 구분자로 3파트 */
  scenarioText?: string;
  performancePrediction?: {
    current: string;
    targetRange: string;
    expectedChanges: string[];
    predictionBasis?: string;
  };
  executionSpec?: {
    videoCount: string;
    targetElement: string;
    comparisonBasis: string;
  };
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

const SECTION_PERF_CHANGES: Record<keyof SectionScoresInput, string[]> = {
  channelActivity: ["활동 신호 회복", "알고리즘 노출 빈도 개선"],
  audienceResponse: ["CTR·반응 신호 회복", "추천 범위 확장"],
  contentStructure: ["포맷 일관성 확보", "시청 유지율 개선"],
  seoOptimization: ["검색 발견성 개선", "외부 유입 회복"],
  growthMomentum: ["성장 신호 회복", "히트 의존도 감소"],
};

const SECTION_EXEC_TARGET: Record<keyof SectionScoresInput, string> = {
  channelActivity: "업로드 빈도",
  audienceResponse: "제목·썸네일·첫 30초 중 1개",
  contentStructure: "포맷·길이 중 1개",
  seoOptimization: "제목 키워드 배치",
  growthMomentum: "재현 포맷",
};

const SECTION_SCENARIO_TEXT: Record<keyof SectionScoresInput, string> = {
  channelActivity:
    `업로드·활동 구간 점수가 기준 이하로, 업로드 공백이 누적되어 알고리즘 노출 기회가 줄어드는 상태입니다.\n` +
    `업로드 빈도가 회복되면 활동 신호가 먼저 반응하고, 알고리즘이 채널을 활성 상태로 재분류합니다.\n` +
    `업로드 재개 → 활동 신호 회복 → 알고리즘 활성 재분류 → 노출 빈도 확대 순으로 변화가 나타날 수 있습니다.`,
  audienceResponse:
    `조회·반응 구간 점수가 기준 이하로, 클릭률·시청 유지율·좋아요 등 반응 신호가 약한 상태입니다.\n` +
    `제목·썸네일·첫 30초를 개선하면 CTR이 먼저 반응하고, 반응 신호 누적으로 알고리즘 추천 범위가 넓어집니다.\n` +
    `CTR 개선 → 반응 신호 누적 → 추천 범위 확장 → 신규 시청자 유입 순으로 변화가 나타날 수 있습니다.`,
  contentStructure:
    `콘텐츠·구조 구간 점수가 기준 이하로, 영상 길이·제목 형식·주제 일관성에 비규칙성이 있는 상태입니다.\n` +
    `포맷을 표준화하면 시청 유지율이 먼저 반응하고, 채널 정체성이 알고리즘에 명확하게 인식됩니다.\n` +
    `포맷 일관성 확보 → 시청 유지율 개선 → 채널 정체성 강화 순으로 변화가 나타날 수 있습니다.`,
  seoOptimization:
    `메타·발견성 구간 점수가 기준 이하로, 제목·태그의 키워드 구성이 약해 검색 유입이 제한된 상태입니다.\n` +
    `제목 앞 15자에 핵심 키워드를 배치하면 검색 발견성이 먼저 개선되고, 외부 유입 경로가 넓어집니다.\n` +
    `키워드 배치 개선 → 검색 발견성 상승 → 외부 유입 확대 순으로 변화가 나타날 수 있습니다.`,
  growthMomentum:
    `성장 신호 구간 점수가 기준 이하로, 구독자 증가·조회 상승 추세가 약한 정체 구간에 있는 상태입니다.\n` +
    `과거 고성과 포맷을 재현하면 반응 신호가 먼저 회복되고, 성장 모멘텀이 점진적으로 복구됩니다.\n` +
    `반복 포맷 재현 → 반응 신호 회복 → 구독자 성장 모멘텀 복구 순으로 변화가 나타날 수 있습니다.`,
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
      title: "조회 히트 집중도 과다",
      whyNeeded: `${formatHitEvidence(bench)} 성과 대부분이 소수 영상에 집중되어 있어, 히트 영상이 없을 때 채널 전체 조회가 급감할 수 있습니다.${formatTail} 지금 다른 주제·포맷으로 한 편을 실험하세요.`.trim(),
      expectedEffect: "중간 성과 영상이 늘어나면 평균 조회수 유지력과 주제 재현성을 함께 높이는 구조로 이어질 수 있습니다.",
      difficulty: "medium",
      executionHint:
        "상위 영상과 다른 주제나 포맷으로 1편만 먼저 실험하고, /analysis 표본과 조회수 차이를 기록하세요.",
      sortTier: 1,
      sortOrder: 0,
      scenarioText:
        `소수 영상에 조회가 집중되어 채널 전체 성과가 히트 의존 구조에 머물고 있습니다.\n` +
        `다른 주제·포맷으로 1편 실험하면 히트와 무관한 중간 성과 영상이 늘어나기 시작합니다.\n` +
        `중간 성과 영상 증가 → 조회 분포 균형화 → 히트 없이도 안정적 조회 구조 형성 순으로 변화가 나타날 수 있습니다.`,
      performancePrediction: {
        current: bench.top3Share != null
          ? `상위 3개 조회 집중 비중 ${pct1(bench.top3Share)}%`
          : bench.topPerformerShare != null
          ? `상위 1개 조회 집중 비중 ${pct1(bench.topPerformerShare)}%`
          : "히트 의존도 높음 (정량 수치 없음)",
        targetRange: "목표 중간 성과 영상 비중 확대",
        expectedChanges: ["중간 성과 영상 증가", "히트 의존도 감소"],
      },
      executionSpec: {
        videoCount: "1편",
        targetElement: "주제 또는 포맷",
        comparisonBasis: "현재 상위 집중도 기준",
      },
    });
  }

  if (hasSample && bench.performanceSpreadLevel === "high") {
    const formatTail =
      bench.dominantFormat != null ? ` 추정 포맷 ${bench.dominantFormat}.` : "";
    out.push({
      id: "channel-dna-spread-repro",
      title: "성과 편차 과대",
      whyNeeded: `조회수 편차가 크게 측정되었습니다.${formatTail ? ` ${formatTail}` : ""} 편차가 크면 어느 요소가 성과를 만드는지 파악하기 어려워져, 좋은 영상을 반복 제작하기 힘들어집니다. 지금 상·하위 영상을 비교해 패턴을 찾으세요.`.trim(),
      expectedEffect: "패턴 분석 후 반복 실험을 이어가면 주제 재현성과 시청 지속시간 안정화에 유리한 구조가 형성됩니다.",
      difficulty: "medium",
      executionHint:
        "상위·하위 영상 각 2편의 제목·썸네일·첫 30초를 표로 비교하고, 다음 업로드에서 한 가지 요소만 맞춰 보세요.",
      sortTier: 2,
      sortOrder: 0,
      scenarioText:
        `상·하위 영상 간 조회 편차가 커서 어떤 요소가 성과를 만드는지 파악하기 어려운 구조입니다.\n` +
        `상·하위 영상을 비교해 반복 가능한 패턴 요소를 하나 정하면 성과 재현 가능성이 높아집니다.\n` +
        `패턴 요소 식별 → 반복 실험 → 재현 가능 포맷 도출 → 조회 편차 감소 순으로 변화가 나타날 수 있습니다.`,
      performancePrediction: {
        current: "조회 편차 높음",
        targetRange: "목표 재현 패턴 2~3개 도출",
        expectedChanges: ["성과 예측 가능성 향상", "상·하위 편차 감소"],
      },
      executionSpec: {
        videoCount: "2~3개",
        targetElement: "포맷·구조 패턴",
        comparisonBasis: "현재 상·하위 영상 직접 비교",
      },
    });
  }

  if (bench.uploadConsistencyLevel === "low") {
    out.push({
      id: "channel-dna-upload-rhythm",
      title: "업로드 리듬 불안정",
      whyNeeded:
        "업로드 일관성이 낮음으로 기록되었습니다. 간격이 불규칙하면 구독자 기대 주기가 형성되지 않고, 알고리즘이 채널을 비활성으로 판단할 수 있습니다. 지금 한 달 업로드 일정을 달력에 배치하세요.",
      expectedEffect: "일정한 발행 리듬이 자리 잡히면 구독 전환 가능성과 반복 시청 가능성을 유지하는 데 유리한 구조입니다.",
      difficulty: "low",
      executionHint:
        "한 달치 공개 예정일을 달력에 먼저 배치하고, 병목이 기획·촬영·편집 중 어디서 발생하는지 단계별로 적어 보세요.",
      sortTier: 3,
      sortOrder: 0,
      scenarioText:
        `업로드 간격이 불규칙해 구독자의 기대 주기가 형성되지 않고 알고리즘 활동 신호가 낮은 상태입니다.\n` +
        `업로드 일정을 달력에 고정하면 발행 리듬이 안정되고 구독자 복귀 패턴이 먼저 형성됩니다.\n` +
        `발행 리듬 안정화 → 구독자 복귀 패턴 형성 → 알고리즘 활성 신호 회복 순으로 변화가 나타날 수 있습니다.`,
      performancePrediction: {
        current: "업로드 일관성 낮음",
        targetRange: "목표 4주 연속 고정 주기",
        expectedChanges: ["구독자 복귀 패턴 형성", "알고리즘 활성 신호 회복"],
      },
      executionSpec: {
        videoCount: "다음 4회 업로드",
        targetElement: "업로드 간격",
        comparisonBasis: "현재 불규칙 패턴 기준",
      },
    });
  }

  if (sections) {
    const keys = Object.keys(SECTION_LABELS) as (keyof SectionScoresInput)[];
    let ord = 0;
    for (const k of keys) {
      if (sections[k] >= SECTION_THRESHOLD) {
        continue;
      }
      const secScore = Math.round(sections[k]);
      out.push({
        id: `channel-dna-section-${k}`,
        title: `${SECTION_LABELS[k]} 구간 보완 필요`,
        whyNeeded: SECTION_WHY_NEEDED[k],
        expectedEffect: CONSERVATIVE_EFFECT,
        difficulty: k === "growthMomentum" ? "high" : "medium",
        executionHint: SECTION_EXECUTION_HINT[k],
        sortTier: 4,
        sortOrder: ord,
        scenarioText: SECTION_SCENARIO_TEXT[k],
        performancePrediction: {
          current: `${SECTION_LABELS[k]} 구간 ${secScore}점`,
          targetRange: "목표 55점 이상 회복",
          expectedChanges: SECTION_PERF_CHANGES[k],
          predictionBasis: `${SECTION_LABELS[k]} 구간 ${secScore}점 기준`,
        },
        executionSpec: {
          videoCount: "1~2개",
          targetElement: SECTION_EXEC_TARGET[k],
          comparisonBasis: `현재 ${secScore}점 기준`,
        },
      });
      ord += 1;
    }
  }

  if (bench.topPatternSignals.length > 0) {
    const quoted = bench.topPatternSignals.slice(0, 2).join(" · ");
    out.push({
      id: "channel-dna-strength-extend",
      title: "강점 패턴 유지 필요",
      whyNeeded: `강점 패턴 — ${quoted} — 이 반복 확인되었습니다. 이 패턴이 성과의 핵심이며, 흔들리면 기존 시청자 반응도 낮아질 수 있습니다. 지금 이 패턴을 명문화하세요.`,
      expectedEffect: "강점 패턴을 유지하면서 단일 요소 실험을 이어가면 반복 시청 가능성과 구독 전환 가능성을 동시에 보강할 수 있습니다.",
      difficulty: "low",
      executionHint:
        "다음 1~2편에서 이 톤과 포맷을 유지하되, 한 가지 요소만 실험적으로 변경해 차이를 비교하세요.",
      sortTier: 5,
      sortOrder: 0,
      scenarioText:
        `반복 확인된 강점 패턴이 현재 성과의 핵심이며, 이 패턴을 흔들면 기존 시청자 반응이 낮아질 수 있습니다.\n` +
        `강점 패턴을 유지하면서 요소 1개만 실험하면, 기존 시청자를 유지한 채 새 반응 구간을 확인할 수 있습니다.\n` +
        `기존 패턴 유지 → 단일 요소 실험 → 신규 반응 구간 탐색 순으로 변화가 나타날 수 있습니다.`,
      performancePrediction: {
        current: "강점 패턴 확인됨",
        targetRange: "목표 패턴 유지 + 신규 시청자 확장",
        expectedChanges: ["기존 시청자 유지", "새 반응 구간 개방"],
      },
      executionSpec: {
        videoCount: "1~2편",
        targetElement: "기존 강점 패턴 1개 요소",
        comparisonBasis: "기존 강점 패턴 대비 반응 비교",
      },
    });
  }

  return applyChannelDnaSampleLimits(out, bench.recentVideosUsed);
}
