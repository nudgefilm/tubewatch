import type { AnalysisResultRow } from "@/lib/analysis/getAnalysisPageData";
import type {
  TrendInsightsBundle,
  TrendItemVm,
} from "@/lib/next-trend/buildTrendInsights";
import type {
  TrendSignalRecord,
  TrendSignalStrength,
  TrendSignalsBundle,
} from "@/lib/next-trend/buildTrendSignals";
import { getSnapshotVideoDurationStats } from "@/lib/next-trend/buildTrendSignals";

export type NextTrendConfidenceLabelKo = "낮음" | "중간" | "높음";

export type NextTrendCandidateVm = {
  topic: string;
  reason: string;
  signal: string;
};

export type NextTrendFormatVm = {
  recommendedFormat: string;
  seriesPotential: string;
  suggestedLength: string;
};

export type NextTrendRiskVm = {
  riskyTopic: string;
  confidence: NextTrendConfidenceLabelKo;
  confidenceBasis: string;
};

export type NextTrendHintsVm = {
  titleDirection: string;
  hook: string;
  thumbnail: string;
  contentAngle: string;
};

export type NextTrendActionsVm = {
  videoPlanDraft: string;
  titleThumbnail: string;
  contentPlan: string;
};

export type NextTrendExtensionVm = {
  /** 외부 트렌드 미연동 시 항상 false — UI에서 확장 전용으로만 표시 */
  available: false;
  headline: string;
  body: string;
  seasonKeywords: string;
  channelFit: string;
  applicationMethod: string;
  riskNote: string;
};

export type NextTrendInternalBlocks = {
  candidates: NextTrendCandidateVm[];
  format: NextTrendFormatVm;
  risk: NextTrendRiskVm;
  hints: NextTrendHintsVm;
  actions: NextTrendActionsVm;
};

/** 공백·대소문자·구두점 차이를 줄인 키로 묶어 중복 후보를 줄입니다. */
function normalizeTopicBucket(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s|·•,:;()[\]'"'\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[?!.,~…]+$/g, "")
    .trim()
    .slice(0, 120);
}

/** 제목만 비슷한 경우(짧은/긴 표현) 한 묶음으로 볼지 여부 */
function isSameTopicCluster(a: string, b: string): boolean {
  const ca = normalizeTopicBucket(a).replace(/\s/g, "");
  const cb = normalizeTopicBucket(b).replace(/\s/g, "");
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  const short = ca.length <= cb.length ? ca : cb;
  const long = ca.length > cb.length ? ca : cb;
  if (short.length < 10) return false;
  return long.startsWith(short) || long.includes(short);
}

function strengthRank(s: TrendSignalStrength): number {
  if (s === "clear") return 0;
  if (s === "medium") return 1;
  return 2;
}

function strengthForVm(
  vm: TrendItemVm,
  records: TrendSignalRecord[]
): TrendSignalStrength {
  const r = records.find((x) => x.id === vm.id);
  return r?.strength ?? "low";
}

/**
 * 신호 기반 관찰 문장을 "다음 영상 아이디어" 제목 형태로 변환한다.
 * 계산 로직 없음, 표현 레이어만.
 */
function toActionTopic(headline: string): string {
  const h = headline;
  const tokenMatch = h.match(/제목에서 '([^']+)' 표현이/);
  if (tokenMatch) {
    const tok = tokenMatch[1];
    return `'${tok}' 주제로 이어지는 다음 편 — 이 축으로 시리즈를 이어가세요`;
  }
  if (h.includes("최근 공개 쪽이") && h.includes("높게")) {
    return "상승 흐름 유지 — 이 포맷으로 다음 영상을 바로 이어 제작하세요";
  }
  if (h.includes("최근 공개 쪽이") && h.includes("낮게")) {
    return "조회 하락 대응 — 포맷을 점검하고 다음 편 방향을 전환하세요";
  }
  if (h.includes("표본 평균 대비 조회가 높게")) {
    return "고조회 포맷 재현 — 이 패턴으로 다음 영상을 기획하세요";
  }
  if (h.includes("짧은 길이") || (h.includes("비중") && h.includes("높게"))) {
    return "숏폼 전환 신호 — 짧은 포맷으로 1편 실험하세요";
  }
  if (h.includes("긴 영상 비중") || (h.includes("재생 길이") && h.includes("길게"))) {
    return "롱폼 전환 신호 — 깊이 있는 주제 1편을 기획하세요";
  }
  if (h.includes("편차가 크다")) {
    return "성과 편차 분석 — 고조회 영상 패턴을 찾아 다음 편에 적용하세요";
  }
  if (h.includes("주제·포맷 반복 패턴")) {
    return "반복 패턴 강화 — 시리즈로 명시화해 다음 편을 연속 제작하세요";
  }
  if (h.includes("공개 간격이") && h.includes("짧게")) {
    return "업로드 리듬 유지 — 이 속도로 다음 편을 바로 기획하세요";
  }
  if (h.includes("공개 간격이") && h.includes("길게")) {
    return "업로드 간격 회복 — 다음 편 공개일을 지금 달력에 고정하세요";
  }
  return h;
}

/**
 * 신호 기반 설명을 "실행 방향" 문장으로 변환한다.
 */
function toActionReason(originalTopic: string, originalReason: string): string {
  const h = originalTopic;
  if (h.includes("주제로 이어지는")) {
    return "이 키워드가 여러 편 제목에 반복 등장합니다. 시청자에게 이 주제의 연속성이 각인되고 있습니다. 다음 편에서도 같은 축을 유지하면 시리즈 효과를 기대할 수 있습니다.";
  }
  if (h.includes("상승 흐름 유지")) {
    return "최근 공개 편의 조회가 이전 평균보다 높아지고 있습니다. 이 포맷과 주제 방향을 유지하며 연속 제작하세요.";
  }
  if (h.includes("조회 하락 대응")) {
    return "최근 편의 조회가 이전 평균보다 낮아지고 있습니다. 제목·썸네일·첫 15초 중 하나를 변경해 2~3편 테스트하세요.";
  }
  if (h.includes("고조회 포맷 재현")) {
    return "특정 영상의 조회가 표본 평균을 크게 웃돌고 있습니다. 이 포맷과 주제 구조를 분석하고, 같은 접근으로 다음 편을 만드세요.";
  }
  if (h.includes("숏폼 전환")) {
    return "최근 표본에서 짧은 영상 비중이 높아지고 있습니다. 숏폼 1편을 테스트해 반응 차이를 직접 측정하세요.";
  }
  if (h.includes("롱폼 전환")) {
    return "최근 표본에서 긴 영상 비중이 높아지고 있습니다. 깊이 있는 주제 1편을 기획해 시청 유지율을 테스트하세요.";
  }
  if (h.includes("성과 편차 분석")) {
    return "조회수 편차가 크게 기록되었습니다. 고조회 영상과 저조회 영상의 제목·포맷 차이를 비교해 반복 가능한 패턴을 찾으세요.";
  }
  if (h.includes("반복 패턴 강화")) {
    return "주제·포맷 반복 패턴이 감지되었습니다. 시리즈 제목에 회차·파트 표기를 추가하면 시청자 기대감을 높일 수 있습니다.";
  }
  if (h.includes("업로드 리듬")) {
    return "공개 간격이 짧아지는 흐름입니다. 이 리듬을 유지하면 알고리즘이 채널을 활성 상태로 인식합니다.";
  }
  if (h.includes("업로드 간격 회복")) {
    return "공개 간격이 길어지고 있습니다. 다음 달 업로드 예정일을 달력에 먼저 배치하고 병목 구간을 점검하세요.";
  }
  return originalReason;
}

/** 우선순위: 반복 주제 > 패턴, 같은 출처면 신호 강도(clear>medium>low) */
function sortKey(
  vm: TrendItemVm,
  records: TrendSignalRecord[],
  source: "repeat" | "pattern"
): number {
  const sr = strengthRank(strengthForVm(vm, records));
  const base = source === "repeat" ? 0 : 100;
  return base + sr;
}

function mergeCandidates(
  repeated: TrendItemVm[],
  patterns: TrendItemVm[],
  records: TrendSignalRecord[],
  max: number
): NextTrendCandidateVm[] {
  type Row = {
    topic: string;
    reason: string;
    signal: string;
    sortKey: number;
  };

  const rows: Row[] = [];
  for (const it of repeated) {
    rows.push({
      topic: it.title,
      reason: it.shortReason,
      signal: it.evidenceSource,
      sortKey: sortKey(it, records, "repeat"),
    });
  }
  for (const it of patterns) {
    rows.push({
      topic: it.title,
      reason: it.shortReason,
      signal: it.evidenceSource,
      sortKey: sortKey(it, records, "pattern"),
    });
  }

  rows.sort((a, b) => a.sortKey - b.sortKey);

  const merged: Row[] = [];
  for (const row of rows) {
    const k = normalizeTopicBucket(row.topic);
    if (!k) continue;

    let hit = -1;
    for (let i = 0; i < merged.length; i += 1) {
      if (
        normalizeTopicBucket(merged[i].topic) === k ||
        isSameTopicCluster(merged[i].topic, row.topic)
      ) {
        hit = i;
        break;
      }
    }

    if (hit === -1) {
      merged.push({ ...row });
      continue;
    }

    const ex = merged[hit];
    if (row.sortKey < ex.sortKey) {
      ex.topic = row.topic.length >= ex.topic.length ? row.topic : ex.topic;
      ex.reason = row.reason;
      ex.signal = row.signal;
      ex.sortKey = row.sortKey;
    } else if (!ex.reason.includes(row.reason.slice(0, 28))) {
      ex.reason = `${ex.reason} ${row.reason}`;
    }
  }

  return merged.slice(0, max).map(({ topic, reason, signal }) => {
    const actionTopic = toActionTopic(topic);
    return {
      topic: actionTopic,
      reason: toActionReason(actionTopic, reason),
      signal,
    };
  });
}

function readAnalysisConfidence(
  row: AnalysisResultRow | null
): "low" | "medium" | "high" | null {
  if (!row) return null;
  const raw = row.analysis_confidence;
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return null;
}

function deriveConfidence(
  recentVideosUsed: number,
  hasEnoughTrendSignal: boolean,
  analysisConfidence: "low" | "medium" | "high" | null
): NextTrendConfidenceLabelKo {
  if (recentVideosUsed < 3) return "낮음";
  let level: NextTrendConfidenceLabelKo = hasEnoughTrendSignal ? "중간" : "낮음";
  if (analysisConfidence === "high") {
    level = hasEnoughTrendSignal ? "높음" : "중간";
  }
  if (analysisConfidence === "low") {
    level = "낮음";
  }
  return level;
}

function formatDurationHint(avgSec: number | null, sampleCount: number): string {
  if (sampleCount === 0) {
    return "표본 영상이 없어 길이 권장을 계산하지 않았습니다.";
  }
  if (avgSec == null || !Number.isFinite(avgSec)) {
    return "표본에 재생 길이가 없어 권장 길이를 수치로 제시하지 않았습니다. 업로드한 영상 길이 분포를 참고하세요.";
  }
  const min = Math.round(avgSec / 60);
  const sec = Math.round(avgSec);
  return `표본 평균 재생 길이는 약 ${sec}초(약 ${min}분)입니다. 짧은 편·긴 편 비중은 위 포맷 신호와 함께 보세요.`;
}

export function buildNextTrendExtensionBlock(): NextTrendExtensionVm {
  return {
    available: false,
    headline: "확장 기능 (2단계) · 시즌·외부 트렌드",
    body:
      "플랫폼·카테고리 시즌 키워드, 채널 적합도, 적용 방식, 외부 리스크는 외부 트렌드·검색 API 연동 후에만 채워집니다. 현재는 내부 표본 블록만 사용하세요.",
    seasonKeywords: "준비 단계 — 외부 시즌·트렌드 API 미연동",
    channelFit: "준비 단계 — 니치 적합도 모델 미연동",
    applicationMethod: "준비 단계 — 적용 시나리오는 확장 파이프라인에서 제공 예정",
    riskNote:
      "플랫폼·시즌 트렌드 리스크는 본 확장에서만 다루며, 위 리스크 메모는 저장된 표본 기준입니다.",
  };
}

export function buildNextTrendInternalSpec(
  insights: TrendInsightsBundle,
  bundle: TrendSignalsBundle,
  snapshot: unknown,
  latestResult: AnalysisResultRow | null
): NextTrendInternalBlocks {
  const dur = getSnapshotVideoDurationStats(snapshot);
  const ac = readAnalysisConfidence(latestResult);

  const candidates = mergeCandidates(
    insights.repeatedTopics,
    insights.detectedPatterns,
    bundle.records,
    5
  );

  const formatHeadline =
    insights.formatChanges[0]?.title ??
    "표본에서 뚜렷한 포맷·길이 전환 한 줄 요약을 만들지 않았습니다.";

  const formatDetail =
    insights.formatChanges[0]?.shortReason ??
    "짧은 영상 비중·평균 길이 변화는 위 요약과 표본 재생 길이 통계를 함께 보세요.";

  const seriesPotential =
    insights.repeatedTopics.length > 0
      ? "반복 주제 신호가 있습니다. 지금 이 주제를 시리즈로 명시화하고 다음 편에서 회차 표기를 시작하세요."
      : "시리즈 신호가 약합니다. 기존 포맷을 유지하면서 1편 실험하세요.";

  const riskyFromFlags = bundle.records.some(
    (r) =>
      r.category === "view" &&
      (r.headline.includes("낮게") || r.detail.includes("낮게"))
  );
  const riskyTopic =
    riskyFromFlags || insights.detectedPatterns.some((p) => p.title.includes("편차"))
      ? "조회 격차나 하락 신호가 있습니다. 제목·썸네일·첫 15초 중 하나를 변경해 2~3편 테스트하세요."
      : "표본에서 뚜렷한 리스크 신호가 없습니다. 기존 방향을 유지하세요.";

  const confidence = deriveConfidence(
    bundle.recentVideosUsed,
    insights.hasEnoughTrendSignal,
    ac
  );

  const basisParts: string[] = [
    `표본 영상 수: ${bundle.recentVideosUsed}편(저장 스냅샷).`,
  ];
  if (ac) {
    basisParts.push(`베이스 분석 신뢰도(analysis_confidence): ${ac}.`);
  }
  if (insights.hasEnoughTrendSignal) {
    basisParts.push("표본 내에서 중간 이상 강도 신호가 일부 확인되었습니다.");
  } else {
    basisParts.push("표본·신호 강도가 제한적이어서 해석 범위를 좁혔습니다.");
  }
  if (bundle.evidenceNotes.length > 0) {
    basisParts.push(...bundle.evidenceNotes.slice(0, 2));
  }

  const hints: NextTrendHintsVm = {
    titleDirection:
      insights.repeatedTopics[0]?.title
        ? `반복 확인된 표현 '${insights.repeatedTopics[0].title.slice(0, 48)}'을 다음 제목 앞부분에 유지하세요.`
        : "표본 상위 키워드를 제목 앞쪽에 배치하세요. 검색과 시청 연속성이 높아집니다.",
    hook: "첫 15초에 결론·숫자·핵심 변화를 먼저 보여주세요. 이탈률이 떨어집니다.",
    thumbnail: "기존 시청자에게 익숙한 색·구도를 유지하세요. 클릭베이트는 이탈률을 높입니다.",
    contentAngle: insights.trendSummary,
  };

  const actions: NextTrendActionsVm = {
    videoPlanDraft: [
      `1) ${insights.trendSummary}`,
      candidates[0]
        ? `2) 지금 만들 영상: ${candidates[0].topic}`
        : "2) 후보 신호가 없으면 최근 반응이 좋았던 편과 동일 포맷으로 1편 먼저 제작하세요.",
      `3) 포맷 방향: ${formatHeadline}`,
    ].join("\n"),
    titleThumbnail:
      "제목: 반복 키워드 + 이번 편만의 구체 숫자·기간을 앞쪽에 배치하세요. 썸네일: 대표 프레임 + 짧은 라벨로 클릭 기대값을 맞추세요.",
    contentPlan: [
      formatDetail,
      formatDurationHint(dur.avgDurationSec, dur.sampleCount),
      insights.formatChanges[1]
        ? `추가 포맷 신호: ${insights.formatChanges[1].title}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  return {
    candidates:
      candidates.length > 0
        ? candidates
        : [
            {
              topic: "신호 부족 — 기존 포맷 반복 전략으로 시작하세요",
              reason:
                "반복·패턴 신호가 충분하지 않습니다. 최근 반응이 좋았던 영상과 동일한 포맷으로 1편을 먼저 제작하고, 표본을 늘린 뒤 다시 확인하세요.",
              signal: "내부 표본 신호",
            },
          ],
    format: {
      recommendedFormat: formatHeadline,
      seriesPotential,
      suggestedLength: formatDurationHint(dur.avgDurationSec, dur.sampleCount),
    },
    risk: {
      riskyTopic,
      confidence,
      confidenceBasis: basisParts.join(" "),
    },
    hints,
    actions,
  };
}

export function buildNextTrendInternalBlocksSkipped(
  summaryLine: string,
  evidenceNotes: string[]
): NextTrendInternalBlocks {
  const basis = evidenceNotes.length > 0 ? evidenceNotes.join(" ") : summaryLine;
  return {
    candidates: [
      {
        topic: "표본을 계산할 수 없음",
        reason: summaryLine,
        signal: "—",
      },
    ],
    format: {
      recommendedFormat: "—",
      seriesPotential: "—",
      suggestedLength: "—",
    },
    risk: {
      riskyTopic: "표본이 없어 특정 주제 위험을 표시하지 않습니다.",
      confidence: "낮음",
      confidenceBasis: basis,
    },
    hints: {
      titleDirection: "—",
      hook: "—",
      thumbnail: "—",
      contentAngle: summaryLine,
    },
    actions: {
      videoPlanDraft: summaryLine,
      titleThumbnail: "—",
      contentPlan: summaryLine,
    },
  };
}
