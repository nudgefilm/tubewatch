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

  return merged.slice(0, max).map(({ topic, reason, signal }) => ({
    topic,
    reason,
    signal,
  }));
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
      ? "제목에 같은 표현이 반복되는 신호가 있어, 같은 축의 시리즈로 묶을 여지가 있습니다. 시청 반응과 함께 판단하세요."
      : "반복 주제 신호가 약해 표본만으로는 시리즈성을 강하게 단정하지 않았습니다.";

  const riskyFromFlags = bundle.records.some(
    (r) =>
      r.category === "view" &&
      (r.headline.includes("낮게") || r.detail.includes("낮게"))
  );
  const riskyTopic =
    riskyFromFlags || insights.detectedPatterns.some((p) => p.title.includes("편차"))
      ? "표본에서 조회 격차·최근 구간 하락 신호가 보이면 주제 피로·썸네일·첫 15초 품질을 의심해볼 수 있습니다."
      : "저장된 표본만으로는 특정 ‘위험 주제’를 지목하지 않습니다. 채널 정책·민감 주제는 별도 검토하세요.";

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
        ? `반복되는 표현(예: ${insights.repeatedTopics[0].title.slice(0, 48)}…)을 제목 앞부분에 유지하는 방향을 검토할 수 있습니다.`
        : "표본 상위 키워드가 있으면 제목 앞쪽에 배치해 검색·시청 연속성을 맞춥니다.",
    hook: "첫 15초 안에 결론·숫자·변화 요약을 제시해 이탈을 줄입니다.",
    thumbnail: "반복 시청자에게 익숙한 색·구도를 유지하되, 클릭베이트와 내용 괴리는 피합니다.",
    contentAngle: insights.trendSummary,
  };

  const actions: NextTrendActionsVm = {
    videoPlanDraft: [
      `1) ${insights.trendSummary}`,
      candidates[0]
        ? `2) 후보 주제: ${candidates[0].topic} — ${candidates[0].reason}`
        : "2) 표본에서 뚜렷한 후보 한 줄이 없으면 최근 반응이 좋았던 편과 동일 각도로 1편 테스트.",
      `3) 포맷: ${formatHeadline}`,
    ].join("\n"),
    titleThumbnail:
      "제목: 반복되는 키워드 + 이번 편만의 구체 결과(숫자·기간). 썸네일: 대표 프레임 + 짧은 라벨로 기대값을 맞춥니다.",
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
              topic: "표본에서 후보 한 줄을 만들지 않았습니다",
              reason:
                "반복·패턴 신호가 비어 있거나 중복만 있었습니다. 표본을 늘리거나 다음 분석 후 다시 확인하세요.",
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
