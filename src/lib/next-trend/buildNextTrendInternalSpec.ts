import type { AnalysisResultRow } from "@/lib/analysis/getAnalysisPageData";
import { normalizeFeatureSnapshot } from "@/lib/analysis/normalizeSnapshot";
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

/** ViewModel 단계에서 생성 — 저장·API 없이 기존 candidate 필드만 재조합 */
export type EvidenceItem = { label: string; value: string };

export type NextTrendCandidateVm = {
  topic: string;
  reason: string;
  signal: string;
  /** 원 신호 강도 — UI에서 "신호 약함" / "반복 신호 확인됨" 표시에 사용 */
  signalStrength: "clear" | "medium" | "low";
  /** 발생 신호·강도에서 파생한 근거 항목 — 새 계산 없음, 빈 배열 허용 */
  evidence?: EvidenceItem[];
  /** 이 시도가 어떤 지표 방향에 도움이 되는지 — 1문장 */
  expectedEffect?: string;
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

export type ViewingPointGauge = {
  label: string;
  score: number; // 1–5
};

export type NextTrendActionsVm = {
  videoPlanDraft: string;
  titleThumbnail: string;
  openingHook: string;
  scriptOutline: string;
  contentPlan: string;
  whyThisTopic: string;
  painPoint: string;
  titleCandidates: string[];
  recommendedTags: string[];
  exitPrevention: string;
  expectedReaction: string;
  viewingPoints: ViewingPointGauge[];
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

/**
 * actionTopic 텍스트로 신호 카테고리를 역추적해 구체적 Evidence를 만든다.
 * 기존 데이터(sortKey 인코딩, detail 원문, recentVideosUsed)만 사용.
 * 없는 값은 빈 배열 반환 — 임의 수치 생성 없음.
 */
function buildCandidateEvidence(
  actionTopic: string,
  signalStrength: "clear" | "medium" | "low",
  originalDetail: string,
  recentVideosUsed: number
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  // ── 반복 키워드 (repeat 토큰) ──────────────────────────────────
  // toActionTopic: `'${tok}' 주제로 이어지는 다음 편…`
  const tokenMatch = actionTopic.match(/'([^']+)' 주제로 이어지는/);
  if (tokenMatch) {
    items.push({ label: "반복 키워드", value: `'${tokenMatch[1]}'` });
    // sortKey % 100: 0=clear(4편+), 1=medium(3편), 2=low(2편)
    const countLabel =
      signalStrength === "clear" ? "표본 내 4편 이상"
      : signalStrength === "medium" ? "표본 내 3편"
      : "표본 내 2편";
    items.push({ label: "등장 횟수", value: countLabel });
    return items;
  }

  // ── 조회 최고 편 패턴 (view 신호) ───────────────────────────────
  // detail 원문: "표본 평균 조회 대비 최고 편이 약 X.XX배…"
  if (actionTopic.includes("반복 가능 패턴 확인")) {
    const ratioMatch = originalDetail.match(/약\s*([\d.]+)배/);
    if (ratioMatch) {
      items.push({ label: "최고 편 조회", value: `평균 대비 약 ${ratioMatch[1]}배` });
    } else {
      items.push({ label: "조회 신호", value: "표본 평균 대비 높게 감지" });
    }
    if (recentVideosUsed >= 3) {
      items.push({ label: "표본", value: `${recentVideosUsed}개 영상 기준` });
    }
    return items;
  }

  // ── 최근 조회 상승 흐름 ──────────────────────────────────────────
  if (actionTopic.includes("상승 흐름 유지")) {
    items.push({ label: "최근 흐름", value: "이전 절반 대비 조회 상승 감지" });
    if (recentVideosUsed >= 4) {
      items.push({ label: "비교 기준", value: `표본 ${recentVideosUsed}개 앞뒤 절반` });
    }
    return items;
  }

  // ── 최근 조회 하락 흐름 ──────────────────────────────────────────
  if (actionTopic.includes("조회 하락 대응")) {
    items.push({ label: "최근 흐름", value: "이전 절반 대비 조회 하락 감지" });
    if (recentVideosUsed >= 4) {
      items.push({ label: "비교 기준", value: `표본 ${recentVideosUsed}개 앞뒤 절반` });
    }
    return items;
  }

  // ── 숏폼 전환 신호 (format 신호) ────────────────────────────────
  // clear: |delta| >= 0.35, medium: >= 0.20
  if (actionTopic.includes("숏폼 전환")) {
    items.push({ label: "포맷 변화", value: "최근 표본 내 짧은 영상 비중 증가" });
    items.push({
      label: "차이 정도",
      value: signalStrength === "clear" ? "35%p 이상 차이" : "20%p 이상 차이",
    });
    return items;
  }

  // ── 롱폼 전환 신호 ───────────────────────────────────────────────
  if (actionTopic.includes("롱폼 전환")) {
    items.push({ label: "포맷 변화", value: "최근 표본 내 긴 영상 비중 증가" });
    items.push({
      label: "차이 정도",
      value: signalStrength === "clear" ? "35%p 이상 차이" : "20%p 이상 차이",
    });
    return items;
  }

  // ── 주제·포맷 반복 패턴 (snapshot_pattern) ───────────────────────
  if (actionTopic.includes("반복 패턴 강화")) {
    items.push({ label: "패턴 출처", value: "스냅샷 주제 반복 플래그" });
    if (recentVideosUsed >= 3) {
      items.push({ label: "표본", value: `${recentVideosUsed}개 영상` });
    }
    return items;
  }

  // ── 조회 편차 (snapshot_pattern: high_view_variance) ─────────────
  if (actionTopic.includes("성과 편차 분석")) {
    items.push({ label: "패턴 출처", value: "스냅샷 조회 편차 플래그" });
    if (recentVideosUsed >= 3) {
      items.push({ label: "표본", value: `${recentVideosUsed}개 영상` });
    }
    return items;
  }

  // ── 업로드 리듬 신호 ─────────────────────────────────────────────
  if (actionTopic.includes("업로드 리듬 유지")) {
    items.push({ label: "리듬 신호", value: "최근 공개 간격 단축 감지" });
    return items;
  }
  if (actionTopic.includes("업로드 간격 회복")) {
    items.push({ label: "리듬 신호", value: "공개 간격 증가 감지" });
    return items;
  }

  // ── fallback — 유효 Evidence 없음 ───────────────────────────────
  return [];
}

function deduplicateCandidates(
  list: NextTrendCandidateVm[],
  max: number
): NextTrendCandidateVm[] {
  const seen: string[] = [];
  const out: NextTrendCandidateVm[] = [];
  for (const c of list) {
    const key = normalizeTopicBucket(c.topic);
    if (!key) continue;
    const dup = seen.some((s) => s === key || isSameTopicCluster(s, key));
    if (!dup) {
      seen.push(key);
      out.push(c);
    }
    if (out.length >= max) break;
  }
  return out;
}

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

function signalStrengthFromSortKey(sk: number): "clear" | "medium" | "low" {
  const rank = sk % 100;
  if (rank === 0) return "clear";
  if (rank === 1) return "medium";
  return "low";
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
  if (tokenMatch && tokenMatch[1].length >= 3) {
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
    return "반복 가능 패턴 확인 — 이 포맷 구조로 다음 1편 시도하세요";
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
  if (h.includes("반복 가능 패턴 확인")) {
    return "특정 영상의 조회가 표본 평균을 웃돌고 있습니다. 이 포맷과 주제 구조를 분석하고, 같은 접근으로 다음 1편을 시도하세요.";
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
    return "공개 간격이 짧아지는 흐름입니다. 이 리듬을 유지하면 구독 전환 가능성과 반복 시청 가능성을 유지하는 데 유리합니다.";
  }
  if (h.includes("업로드 간격 회복")) {
    return "공개 간격이 길어지고 있습니다. 다음 달 업로드 예정일을 달력에 먼저 배치하고 병목 구간을 점검하세요.";
  }
  return originalReason;
}

/**
 * 각 후보 주제에 대한 "예상 변화" 1문장 — 내부 데이터 기반, 예언형 없음
 */
function toActionEffect(actionTopic: string): string {
  if (actionTopic.includes("주제로 이어지는")) {
    return "시리즈 연속성은 반복 시청 가능성과 주제 재현성을 동시에 높이는 방향으로 작용합니다.";
  }
  if (actionTopic.includes("상승 흐름 유지")) {
    return "상승 흐름 유지는 평균 조회수 유지력과 초반 클릭 유도력 보강에 유리한 구조입니다.";
  }
  if (actionTopic.includes("조회 하락 대응")) {
    return "포맷 조정 실험은 초반 이탈 감소와 CTR 회복에 도움이 될 수 있습니다.";
  }
  if (actionTopic.includes("반복 가능 패턴 확인")) {
    return "확인된 패턴 반복은 평균 조회수 유지력과 주제 재현성을 높이는 방향으로 작용합니다.";
  }
  if (actionTopic.includes("숏폼 전환")) {
    return "짧은 포맷 실험은 초반 클릭 유도력과 반복 시청 가능성 확인에 유리한 구조입니다.";
  }
  if (actionTopic.includes("롱폼 전환")) {
    return "깊이 있는 포맷은 시청 지속시간 방어와 반복 시청 가능성 보강에 도움이 될 수 있습니다.";
  }
  if (actionTopic.includes("성과 편차 분석")) {
    return "고성과 패턴 식별은 주제 재현성과 평균 조회수 유지력을 높이는 방향으로 작용합니다.";
  }
  if (actionTopic.includes("반복 패턴 강화")) {
    return "시리즈 명시화는 반복 시청 가능성과 초반 클릭 유도력 보강에 유리한 구조입니다.";
  }
  if (actionTopic.includes("업로드 리듬 유지")) {
    return "발행 리듬 유지는 반복 시청 가능성과 구독 전환 가능성을 보강하는 방향으로 작용합니다.";
  }
  if (actionTopic.includes("업로드 간격 회복")) {
    return "공개 간격 회복은 반복 시청 가능성과 주제 재현성 유지에 유리한 구조입니다.";
  }
  return "시청 지속시간과 CTR 변화를 직접 확인하면 재현 가능한 패턴을 좁혀나갈 수 있습니다.";
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
  max: number,
  recentVideosUsed: number
): NextTrendCandidateVm[] {
  type Row = {
    topic: string;
    reason: string;
    signal: string;
    sortKey: number;
    signalStrength: "clear" | "medium" | "low";
    originalReason: string; // it.shortReason before toActionReason — for evidence
  };

  const rows: Row[] = [];
  for (const it of repeated) {
    const sk = sortKey(it, records, "repeat");
    rows.push({
      topic: it.title,
      reason: it.shortReason,
      signal: it.evidenceSource,
      sortKey: sk,
      signalStrength: signalStrengthFromSortKey(sk),
      originalReason: it.shortReason,
    });
  }
  for (const it of patterns) {
    const sk = sortKey(it, records, "pattern");
    rows.push({
      topic: it.title,
      reason: it.shortReason,
      signal: it.evidenceSource,
      sortKey: sk,
      signalStrength: signalStrengthFromSortKey(sk),
      originalReason: it.shortReason,
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
      ex.signalStrength = row.signalStrength;
      ex.originalReason = row.originalReason;
    }
    // 유사 후보 병합 — reason 중복 연결 제거 (세부 각도는 signal에 통합)
  }

  return merged.slice(0, max).map(({ topic, reason, signal, signalStrength, originalReason }) => {
    const actionTopic = toActionTopic(topic);
    return {
      topic: actionTopic,
      reason: toActionReason(actionTopic, reason),
      signal,
      signalStrength,
      evidence: buildCandidateEvidence(actionTopic, signalStrength, originalReason, recentVideosUsed),
      expectedEffect: toActionEffect(actionTopic),
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

function buildGeminiTopicCandidates(
  recommendedTopics: string[]
): NextTrendCandidateVm[] {
  return recommendedTopics.slice(0, 4).map((topic, i) => ({
    topic,
    reason:
      "튜브워치가 채널 데이터를 분석해 다음 영상으로 추천한 주제입니다. 채널의 강점·패턴·시청자층을 종합해 도출했습니다.",
    signal: "튜브워치 추천",
    signalStrength: i === 0 ? ("clear" as const) : ("medium" as const),
    evidence: [{ label: "출처", value: "튜브워치 채널 분석 추천" }],
    expectedEffect:
      "채널 특성에 맞는 주제로 시작해 초반 클릭율과 시청 지속시간을 함께 테스트할 수 있습니다.",
  }));
}

export function buildNextTrendInternalSpec(
  insights: TrendInsightsBundle,
  bundle: TrendSignalsBundle,
  snapshot: unknown,
  latestResult: AnalysisResultRow | null
): NextTrendInternalBlocks {
  const dur = getSnapshotVideoDurationStats(snapshot);
  const ac = readAnalysisConfidence(latestResult);

  const recommendedTopics: string[] = Array.isArray(
    (latestResult as Record<string, unknown> | null)?.recommended_topics
  )
    ? ((latestResult as Record<string, unknown>).recommended_topics as string[]).filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      )
    : [];

  const geminiCandidates = buildGeminiTopicCandidates(recommendedTopics);

  const snapshotCandidates = mergeCandidates(
    insights.repeatedTopics,
    insights.detectedPatterns,
    bundle.records,
    5,
    bundle.recentVideosUsed
  );

  // Gemini 추천 주제가 있으면 앞에 배치, 스냅샷 신호는 보조 근거로
  const candidatePool =
    geminiCandidates.length > 0
      ? deduplicateCandidates([...geminiCandidates, ...snapshotCandidates], 5)
      : snapshotCandidates;

  const candidates = candidatePool;

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

  const topTopic = candidates[0]?.topic ?? null;
  const durationHint = formatDurationHint(dur.avgDurationSec, dur.sampleCount);

  // ── 채널 특화 데이터 추출 ──────────────────────────────────────────────────
  const getRF = <T>(key: string, fb: T): T => {
    const v = (latestResult as Record<string, unknown> | null)?.[key];
    return v !== undefined && v !== null ? (v as T) : fb;
  };
  const strengths = getRF<string[]>("strengths", []);
  const weaknesses = getRF<string[]>("weaknesses", []);
  const bottlenecks = getRF<string[]>("bottlenecks", []);
  const targetAudience = getRF<string[]>("target_audience", []);
  const sectionScores = getRF<Record<string, number>>("feature_section_scores", {});

  const videos = normalizeFeatureSnapshot(snapshot).videos;

  // 팬덤 응집도 계산
  const totalEngagement = videos.reduce((s, v) => s + (v.likeCount ?? 0) + (v.commentCount ?? 0), 0);
  const totalViews = videos.reduce((s, v) => s + (v.viewCount ?? 0), 0);
  const loyaltyRate = totalViews > 0 ? totalEngagement / totalViews : 0;
  const per100Views = Math.round(loyaltyRate * 1000) / 10;
  const loyaltyGrade = loyaltyRate >= 0.05 ? "높음" : loyaltyRate >= 0.02 ? "평균" : "낮음";

  // 고성과 영상 추출 (view 신호)
  const viewRecord = bundle.records.find((r) => r.category === "view" && r.detail.includes("«"));
  const topVideoTitle = viewRecord?.detail.match(/«([^»]+)»/)?.[1] ?? null;
  const viewRatio = viewRecord?.detail.match(/약 ([\d.]+)배/)?.[1] ?? null;

  // 반복 키워드 (실제 단어만 추출)
  const topKeywords = insights.repeatedTopics
    .slice(0, 3)
    .map((t) => { const m = t.title.match(/[''']([^''']+)[''']/); return m ? m[1] : null; })
    .filter((k): k is string => !!k);

  // 태그 빈도 추출 (스냅샷 영상)
  const tagFreq: Record<string, number> = {};
  for (const video of videos) {
    for (const tag of video.tags) {
      if (tag.length >= 2) tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
    }
  }
  const topTagsFromSnapshot = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // 시청 포인트 게이지 (1–5)
  const g = (s: number) => Math.max(1, Math.min(5, Math.round(s / 20)));
  const hasExpertSignal = strengths.some((s) =>
    ["전문", "정보", "깊이", "분석", "설명"].some((kw) => s.includes(kw))
  );
  const avgDescLen = videos.length > 0
    ? videos.reduce((s, v) => s + (v.descriptionLength ?? 0), 0) / videos.length
    : 0;
  const avgTagCount = videos.length > 0
    ? videos.reduce((s, v) => s + v.tags.length, 0) / videos.length
    : 0;
  const viewingPoints: ViewingPointGauge[] = [
    { label: "대중성",   score: g(sectionScores.audienceResponse ?? 50) },
    { label: "전문성",   score: hasExpertSignal ? 4 : avgDescLen > 400 ? 4 : avgDescLen > 150 ? 3 : 2 },
    { label: "자극도",   score: viewRecord?.strength === "clear" ? 4 : viewRecord ? 3 : 2 },
    { label: "정보성",   score: avgTagCount > 5 ? 4 : avgTagCount > 3 ? 3 : avgDescLen > 200 ? 3 : 2 },
    { label: "팬서비스", score: g(sectionScores.channelActivity ?? 50) },
  ];

  const actions: NextTrendActionsVm = {

    // ── 기획 의도 ─────────────────────────────────────────────────────────────
    whyThisTopic: [
      topTopic
        ? `이 영상의 역할: **${topTopic}**으로 신규 검색 유입과 기존 구독자 재방문을 동시에 잡는 것.`
        : `이 영상의 역할: 채널의 현재 강점을 새로운 시청자층에게 닿게 하는 것.`,
      viewRatio
        ? `지금 해야 하는 이유: 이 방향의 영상이 채널 평균 대비 **${viewRatio}배** 조회를 기록했습니다. 이 흐름을 지금 이어가세요.`
        : `지금 해야 하는 이유: 팬덤 응집도 **${loyaltyGrade}** — 조회 100회당 **${per100Views}회** 반응. ${sectionScores.audienceResponse != null ? `시청자 응답률 **${Math.round(sectionScores.audienceResponse)}점** / 100점.` : ""}`,
      strengths[0]
        ? `기대 효과: 채널 강점 **'${strengths[0].slice(0, 40)}'** 을 전면에 내세워 이탈을 최소화하면서 신규 구독자를 확보하세요.`
        : `기대 효과: 검색 유입과 시청 완료율을 동시에 높일 수 있는 구조입니다.`,
    ].join("\n"),

    // ── 문제 진단 & 해결 방향 ────────────────────────────────────────────────
    painPoint: (() => {
      const problem = weaknesses[0] ?? bottlenecks[0];
      const cause = weaknesses[1] ?? null;
      const seoLine = sectionScores.seoOptimization != null
        ? `SEO 최적화 점수 **${Math.round(sectionScores.seoOptimization)}점** / 100점 — 제목 첫 어절에 검색 키워드를 배치해 점수를 올리세요.`
        : null;
      if (!problem && !seoLine) {
        return `채널 데이터에서 구체적인 결핍 신호가 확인되지 않았습니다. 표본 영상을 늘린 후 재분석하면 더 정밀한 진단이 나옵니다.`;
      }
      return [
        problem ? `**문제** — ${problem}` : "",
        cause ? `**원인** — ${cause}` : "",
        problem ? `**해결** — 이 영상 중반에 댓글 유도 질문("여러분은 어떻게 하고 계신가요?")을 자막으로 삽입하세요. 참여율이 오르면 알고리즘 노출도 함께 올라갑니다.` : "",
        seoLine ? `  → ${seoLine}` : "",
      ].filter(Boolean).join("\n");
    })(),

    // ── 영상 기획안 (촬영 기준) ───────────────────────────────────────────────
    videoPlanDraft: [
      topTopic
        ? `**컨셉** — ${topTopic}: 시청자가 영상 한 편으로 바로 실행할 수 있는 수준의 가이드`
        : `**컨셉** — 최근 반응이 좋았던 포맷을 유지하면서 구체적인 결과물을 보여주는 영상`,
      topVideoTitle
        ? `**핵심 장면 ①** — 오프닝: «${topVideoTitle}» 구조를 참고해 결과 장면부터 시작하세요.`
        : `**핵심 장면 ①** — 오프닝: 완성 결과물 또는 핵심 수치를 첫 화면에 배치하세요.`,
      `**핵심 장면 ②** — 과정 시연: 텍스트 설명 없이 화면을 직접 보여주세요. 각 단계마다 "Step N" 자막을 붙이세요.`,
      `**핵심 장면 ③** — 전후 비교 또는 수치 공개: 시청자가 "나도 할 수 있다"고 느끼게 마무리하세요.`,
      `**흐름** — Hook(0~15초) → 단계별 시연(15초~중반) → 결론·CTA(말미 30초)`,
    ].join("\n"),

    // ── 제목 후보 3안 ─────────────────────────────────────────────────────────
    titleCandidates: (() => {
      const subject = topTopic ?? "이 주제";
      const ratioText = viewRatio ? `조회수 ${viewRatio}배 차이 만든` : "채널에서 반응 좋았던";
      return [
        `${ratioText} — ${subject} 핵심만 정리 (바로 따라하기)`,
        `이걸 모르면 손해 — ${subject}, 지금 안 하면 늦는 이유`,
        `직접 해봤습니다 — ${subject} 전vs후, 결과가 이렇게 달라요`,
      ];
    })(),

    // ── 썸네일 방향 ──────────────────────────────────────────────────────────
    titleThumbnail: (() => {
      const subject = topTopic ?? "핵심 정리";
      const textOverlay = subject.length <= 14 ? subject : subject.split(" ").slice(0, 3).join(" ");
      const repeatedKw = insights.repeatedTopics[0]?.title.match(/[''']([^''']+)[''']/)?.[1];
      return [
        `**텍스트 문구** — "${textOverlay}"`,
        viewRecord?.strength === "clear"
          ? `**이미지 구성** — 채널 최고 성과 영상과 동일한 색·구도 유지. 얼굴 표정(확신 또는 놀람) + 수치 텍스트를 대비 구성으로 배치하세요.`
          : `**이미지 구성** — 얼굴 클로즈업(확신 표정) + 결과 수치를 대비 배치하세요. 배경은 단색 또는 채널 고유색을 유지하세요.`,
        repeatedKw ? `  → 채널 반복 노출 패턴: '${repeatedKw}' 관련 장면이 클릭율이 높습니다.` : "",
      ].filter(Boolean).join("\n");
    })(),

    // ── 오프닝 훅 ────────────────────────────────────────────────────────────
    openingHook: (() => {
      const subject = topTopic ?? "이 주제";
      const shortSub = subject.split(" ").slice(0, 3).join(" ");
      const hookLine = viewRatio
        ? `"${shortSub}, 이것만 바꿨는데 조회수가 ${viewRatio}배가 됐습니다. 지금 바로 보여드릴게요."`
        : `"${shortSub} — 결론부터 드릴게요. 오늘 영상 끝나면 바로 쓸 수 있습니다."`;
      return [
        `**1문장 훅** — ${hookLine}`,
        `  → 첫 3초 안에 "이 영상이 나에게 필요하다"는 신호를 줘야 이탈이 멈춥니다.`,
      ].join("\n");
    })(),

    // ── 대본 구조 ────────────────────────────────────────────────────────────
    scriptOutline: (() => {
      const subject = topTopic ?? "이 주제";
      const shortSub = subject.split(" ").slice(0, 3).join(" ");
      return [
        `**① 오프닝** (0~15초)`,
        `  대사: "${shortSub}, 결론부터 드릴게요. [핵심 수치 or 결과]. 처음부터 바로 따라할 수 있게 보여드립니다."`,
        `**② 본론 전반** — ${formatDetail}`,
        `  각 단계 시작에 "Step N" 자막을 붙이고, 텍스트 설명보다 화면 직접 시연으로 구성하세요.`,
        `**③ 본론 후반** — 실전 적용 + 댓글 참여 유도`,
        `  중간 자막: "여러분은 어떤 방법을 쓰고 계신가요? 댓글로 알려주세요!"`,
        `**④ 클로징** (마지막 30초)`,
        `  대사: "오늘 핵심은 딱 하나입니다. [1줄 요약]. 다음 편은 [예고 주제]로 돌아오겠습니다."`,
        `  → 권장 길이: ${durationHint}`,
        insights.formatChanges[1] ? `  → 추가 포맷 신호: ${insights.formatChanges[1].title}` : "",
      ].filter(Boolean).join("\n");
    })(),

    // ── 이탈 방지 포인트 ──────────────────────────────────────────────────────
    exitPrevention: [
      `**도입부 30초** — 결론이나 완성 장면을 먼저 보여주세요. 시청자는 이 구간에서 끝까지 볼지를 결정합니다.`,
      `**중반 (40~60%)** — "다음 파트 예고" 자막 또는 댓글 유도 질문을 넣어 이탈을 막으세요.`,
      `**전문 용어** — 즉시 1줄 설명을 붙이세요. '이해 실패' 느낌이 오면 시청자는 바로 나갑니다.`,
    ].join("\n"),

    // ── 제작 팁 ──────────────────────────────────────────────────────────────
    contentPlan: [
      `업로드 직후 **핀 댓글**로 시청자 질문을 남기세요. 초반 댓글 활성화가 알고리즘 노출을 높입니다.`,
      `업로드 후 **48시간** 안에 CTR을 확인하세요. 4% 미만이면 썸네일부터 교체하세요.`,
      insights.formatChanges[1]
        ? `같은 주제로 **Shorts 1편**을 병행 업로드하면 유입 경로가 넓어집니다.`
        : `제목을 2개 준비해 **A/B 테스트**하세요. 24시간 CTR이 높은 쪽으로 고정하세요.`,
    ].join("\n"),

    // ── 예상 시청자 반응 ──────────────────────────────────────────────────────
    expectedReaction: [
      targetAudience[0]
        ? `**${targetAudience[0]}** 중심으로 '써먹을 수 있었다'는 댓글 반응이 예상됩니다.`
        : `기존 구독자 중심으로 실용적 정보에 대한 긍정 반응이 예상됩니다.`,
      `초반 24시간 **CTR**과 **시청 유지율**을 확인하세요. 채널 평균 이상이면 후속편을 바로 기획하세요.`,
      `  → 2~3편 테스트 후 반응이 좋은 포맷을 시리즈로 확장하세요.`,
    ].join("\n"),

    // ── 추천 태그 ─────────────────────────────────────────────────────────────
    recommendedTags: Array.from(
      new Set([
        ...topTagsFromSnapshot,
        ...topKeywords.filter((k) => k.length <= 10),
        ...(topTopic ? topTopic.split(" ").filter((w) => w.length >= 2).slice(0, 2) : []),
      ])
    ).filter((t) => t.length >= 2).slice(0, 5),

    viewingPoints,
  };

  return {
    candidates:
      candidates.length > 0
        ? candidates
        : [
            {
              topic: "신호 부족 — 분석을 다시 실행하면 추천 주제가 생성됩니다",
              reason:
                "추천 주제와 반복·패턴 신호 모두 확인되지 않았습니다. 분석을 재실행하거나 표본을 늘린 뒤 다시 확인하세요.",
              signal: "데이터 부족",
              signalStrength: "low" as const,
              evidence: [],
              expectedEffect: "소규모 실험으로 CTR과 반복 시청 가능성을 직접 확인하면 재현 패턴을 좁혀나갈 수 있습니다.",
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
        topic: "표본 부족 — 분석 후 재확인하세요",
        reason: summaryLine,
        signal: "표본 부족",
        signalStrength: "low" as const,
        evidence: [],
        expectedEffect: "소규모 실험으로 CTR과 반복 시청 가능성을 직접 확인하면 재현 패턴을 좁혀나갈 수 있습니다.",
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
      openingHook: "—",
      scriptOutline: "—",
      contentPlan: summaryLine,
      whyThisTopic: "—",
      painPoint: "—",
      titleCandidates: [],
      recommendedTags: [],
      exitPrevention: "—",
      expectedReaction: "—",
      viewingPoints: [],
    },
  };
}
