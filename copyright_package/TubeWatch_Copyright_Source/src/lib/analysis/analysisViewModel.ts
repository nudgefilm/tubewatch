/**
 * Channel Analysis 전용 ViewModel.
 * `feature_snapshot.metrics` 및 분석 결과 메타만 사용하며, UI는 수정하지 않고 주입 데이터로만 소비한다.
 */
import type { AnalysisResultRow } from "@/lib/analysis/getAnalysisPageData";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";

/** 단일 분석 결과 행 — build 진입점 입력 */
export type AnalysisResult = AnalysisResultRow;

export type AnalysisCardState = "good" | "normal" | "warning";

export type DataStatus = "ready" | "partial" | "locked" | "empty";

export type Confidence = "high" | "medium" | "low";

export type AnalysisCardVM = {
  id: string;
  title: string;
  value: number | string;
  state: AnalysisCardState;
  insight: string;
  confidence: Confidence;
  dataStatus: DataStatus;
};

export type AnalysisSummaryVm = {
  /** Hero·요약 스트립 상단 한 줄 */
  headline: string;
  /** 보조 한 줄 (업로드·조회 등 스냅샷 기반) */
  supportingLineA: string | null;
  /** 보조 한 줄 (참여·패턴 등 스냅샷 기반) */
  supportingLineB: string | null;
  /** 표본·데이터 상태 안내 (amber 박스용, 없으면 null) */
  sampleNote: string | null;
};

export type AnalysisViewModel = {
  cards: AnalysisCardVM[];
  summary: AnalysisSummaryVm;
  /** Hero 신뢰도 툴팁에 표시할 근거 문장 */
  confidenceReasons: string[];
  overallDataStatus: DataStatus;
  overallConfidence: Confidence;
  resultId: string | null;
  sampleVideoCount: number | null;
};

const TARGET_SAMPLE = 20;

type MetricsPartial = Partial<Record<keyof ChannelMetrics, number>>;

function extractMetrics(snapshot: unknown): MetricsPartial | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }
  const raw = (snapshot as Record<string, unknown>).metrics;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as MetricsPartial;
}

function extractPatterns(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }
  const raw = (snapshot as Record<string, unknown>).patterns;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function countVideosInSnapshot(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }
  const raw = (snapshot as Record<string, unknown>).videos;
  if (!Array.isArray(raw)) {
    return null;
  }
  return raw.length;
}

function readSampleVideoCount(
  row: AnalysisResultRow,
  snapshot: unknown
): number | null {
  const a = row["sample_video_count"];
  if (typeof a === "number" && Number.isFinite(a)) {
    return Math.max(0, Math.floor(a));
  }
  return countVideosInSnapshot(snapshot);
}

function readAnalysisConfidence(row: AnalysisResultRow): Confidence {
  const raw = row["analysis_confidence"];
  if (raw === "high") return "high";
  if (raw === "low") return "low";
  return "medium";
}

function readStringField(row: AnalysisResultRow, key: string): string | null {
  const v = row[key];
  if (typeof v === "string" && v.trim() !== "") {
    return v.trim();
  }
  return null;
}

function readStringArrayField(row: AnalysisResultRow, key: string): string[] {
  const v = row[key];
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

function formatDays(d: number): string {
  if (!Number.isFinite(d)) return "—";
  return `${d.toFixed(1)}일`;
}

function formatPercentRatio(r: number): string {
  if (!Number.isFinite(r)) return "—";
  return `${(r * 100).toFixed(2)}%`;
}

function formatDurationSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return "—";
  }
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function firstSentence(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  const head = parts[0]?.trim();
  return head && head.length > 0 ? head : text.trim();
}

function buildSummaryVm(
  cards: AnalysisCardVM[],
  sampleVideoCount: number | null,
  overallDataStatus: DataStatus,
  overallConfidence: Confidence
): AnalysisSummaryVm {
  const headline = `저장된 분석 스냅샷 기준 표본 영상 수는 ${sampleVideoCount != null ? `${sampleVideoCount}건` : "미기록"}이며, 데이터 상태는 ${overallDataStatus}, 분석 신뢰도는 ${overallConfidence}로 집계되었습니다.`;
  const upload = cards.find((c) => c.id === "upload_frequency");
  const view = cards.find((c) => c.id === "view_performance");
  const pattern = cards.find((c) => c.id === "pattern_analysis");
  const supportingLineA =
    upload && view
      ? `${firstSentence(upload.insight)} ${firstSentence(view.insight)}`.trim()
      : upload
        ? firstSentence(upload.insight)
        : view
          ? firstSentence(view.insight)
          : null;
  const supportingLineB = pattern ? firstSentence(pattern.insight) : null;

  let sampleNote: string | null = null;
  if (
    overallDataStatus === "partial" ||
    overallDataStatus === "empty" ||
    (sampleVideoCount != null &&
      sampleVideoCount > 0 &&
      sampleVideoCount < TARGET_SAMPLE)
  ) {
    sampleNote = `표본 ${sampleVideoCount != null ? `${sampleVideoCount}건` : "미기록"} · 스냅샷 데이터 상태 ${overallDataStatus} · 분석 신뢰도 ${overallConfidence}`;
  }

  return {
    headline,
    supportingLineA,
    supportingLineB,
    sampleNote,
  };
}

function buildConfidenceReasons(
  overallConfidence: Confidence,
  overallDataStatus: DataStatus,
  sampleVideoCount: number | null
): string[] {
  return [
    `저장된 analysis_confidence·스냅샷 기준 분석 신뢰도: ${overallConfidence}`,
    `스냅샷 데이터 상태: ${overallDataStatus}`,
    `표본 영상 수: ${sampleVideoCount != null ? `${sampleVideoCount}건` : "미기록"}`,
  ];
}

function clampConfidence(
  base: Confidence,
  dataStatus: DataStatus
): Confidence {
  if (dataStatus === "empty") return "low";
  if (dataStatus === "partial") {
    if (base === "high") return "medium";
    return base;
  }
  return base;
}

function deriveOverallDataStatus(
  cards: AnalysisCardVM[],
  sample: number | null
): DataStatus {
  if (cards.every((c) => c.dataStatus === "empty")) {
    return "empty";
  }
  if (
    sample != null &&
    sample > 0 &&
    sample < TARGET_SAMPLE
  ) {
    return "partial";
  }
  if (cards.some((c) => c.dataStatus === "partial")) {
    return "partial";
  }
  if (cards.some((c) => c.dataStatus === "locked")) {
    return "locked";
  }
  return "ready";
}

function scoreUploadState(
  recent30d: number | null,
  intervalDays: number | null
): AnalysisCardState {
  if (recent30d != null && recent30d === 0) {
    return "warning";
  }
  if (intervalDays != null && intervalDays > 21) {
    return "warning";
  }
  if (intervalDays != null && intervalDays <= 10) {
    return "good";
  }
  if (recent30d != null && recent30d >= 4) {
    return "good";
  }
  return "normal";
}

function scoreViewState(
  avg: number | null,
  median: number | null
): AnalysisCardState {
  if (avg != null && avg < 50) {
    return "warning";
  }
  if (avg != null && median != null && median > 0 && avg / median > 5) {
    return "warning";
  }
  if (avg != null && avg >= 1000) {
    return "good";
  }
  return "normal";
}

function scoreEngagementState(
  likeRatio: number | null,
  commentRatio: number | null
): AnalysisCardState {
  const lr = likeRatio ?? 0;
  const cr = commentRatio ?? 0;
  if (lr < 0.005 && cr < 0.0005) {
    return "warning";
  }
  if (lr >= 0.03 || cr >= 0.002) {
    return "good";
  }
  return "normal";
}

function scoreDurationState(seconds: number | null): AnalysisCardState {
  if (seconds == null) return "normal";
  if (seconds < 60) {
    return "warning";
  }
  if (seconds > 600 && seconds < 3600) {
    return "good";
  }
  return "normal";
}

function cardDataStatus(hasAll: boolean, hasSome: boolean): DataStatus {
  if (hasAll) return "ready";
  if (hasSome) return "partial";
  return "empty";
}

export function buildAnalysisViewModel(data: AnalysisResult): AnalysisViewModel {
  const snapshot = data.feature_snapshot;
  const metrics = extractMetrics(snapshot);
  const patterns = extractPatterns(snapshot);
  const sampleVideoCount = readSampleVideoCount(data, snapshot);
  const baseConfidence = readAnalysisConfidence(data);
  const weaknesses = readStringArrayField(data, "weaknesses");
  const contentPatternSummary = readStringField(data, "content_pattern_summary");

  const cards: AnalysisCardVM[] = [];

  const mRecent = metrics?.recent30dUploadCount ?? null;
  const mInterval = metrics?.avgUploadIntervalDays ?? null;
  const uploadValue =
    mRecent != null
      ? `최근 30일 ${formatInt(mRecent)}개`
      : mInterval != null
        ? `평균 간격 ${formatDays(mInterval)}`
        : "—";
  const uploadHasSome = mRecent != null || mInterval != null;
  const uploadHasAll = mRecent != null && mInterval != null;
  const uploadDs = cardDataStatus(uploadHasAll, uploadHasSome);
  const uploadState = scoreUploadState(mRecent, mInterval);
  const uploadInsight =
    uploadDs === "empty"
      ? "저장된 스냅샷에서 업로드 빈도에 해당하는 수치가 없습니다. 원인은 표본 메트릭 미기록입니다. 의미는 카드 해석을 제공할 수 없음을 뜻합니다. 행동은 베이스 분석을 다시 실행해 feature_snapshot.metrics를 채운 뒤 동일 항목을 비교하는 것이 안전합니다."
      : `저장된 표본에서 최근 30일 업로드 수는 ${mRecent != null ? `${formatInt(mRecent)}개` : "미기록"}이고, 평균 업로드 간격은 ${mInterval != null ? formatDays(mInterval) : "미기록"}입니다. 원인은 채널 활동 메트릭이 스냅샷에 기록된 범위입니다. 의미는 현재 시점의 업로드 리듬을 수치로 요약한 것입니다. 행동은 다음 분석에서 동일 필드를 비교해 간격·건수 변화를 추적하는 것입니다.`;

  cards.push({
    id: "upload_frequency",
    title: "업로드 빈도",
    value: uploadValue,
    state: uploadDs === "empty" ? "normal" : uploadState,
    insight: uploadInsight,
    confidence: clampConfidence(baseConfidence, uploadDs),
    dataStatus: uploadDs,
  });

  const avgV = metrics?.avgViewCount ?? null;
  const medV = metrics?.medianViewCount ?? null;
  const viewValue =
    avgV != null && medV != null
      ? `평균 ${formatInt(avgV)} / 중앙 ${formatInt(medV)}`
      : avgV != null
        ? `평균 ${formatInt(avgV)}`
        : medV != null
          ? `중앙 ${formatInt(medV)}`
          : "—";
  const viewHasSome = avgV != null || medV != null;
  const viewHasAll = avgV != null && medV != null;
  const viewDs = cardDataStatus(viewHasAll, viewHasSome);
  const viewState = scoreViewState(avgV, medV);
  const viewInsight =
    viewDs === "empty"
      ? "저장된 스냅샷에서 조회수 요약(평균·중앙)이 없습니다. 원인은 표본 조회 메트릭 미기록입니다. 의미는 조회 분포를 설명할 수 없음을 뜻합니다. 행동은 분석 파이프라인이 avgViewCount·medianViewCount를 채우도록 한 뒤 재조회하는 것입니다."
      : `저장된 표본에서 평균 조회수는 ${avgV != null ? formatInt(avgV) : "미기록"}, 중앙 조회수는 ${medV != null ? formatInt(medV) : "미기록"}입니다. 원인은 스냅샷에 집계된 조회 분포입니다. 의미는 대표값 대비 상위 영상 쏠림 여부를 수치로 볼 수 있다는 점입니다. 행동은 동일 표본 크기를 유지한 채 다음 스냅샷과 평균·중앙 차이를 비교하는 것입니다.`;

  cards.push({
    id: "view_performance",
    title: "조회수 퍼포먼스",
    value: viewValue,
    state: viewDs === "empty" ? "normal" : viewState,
    insight: viewInsight,
    confidence: clampConfidence(baseConfidence, viewDs),
    dataStatus: viewDs,
  });

  const likeR = metrics?.avgLikeRatio ?? null;
  const comR = metrics?.avgCommentRatio ?? null;
  const engValue =
    likeR != null && comR != null
      ? `좋아요 ${formatPercentRatio(likeR)} · 댓글 ${formatPercentRatio(comR)}`
      : likeR != null
        ? `좋아요 ${formatPercentRatio(likeR)}`
        : comR != null
          ? `댓글 ${formatPercentRatio(comR)}`
          : "—";
  const engHasSome = likeR != null || comR != null;
  const engHasAll = likeR != null && comR != null;
  const engDs = cardDataStatus(engHasAll, engHasSome);
  const engState = scoreEngagementState(likeR, comR);
  const engInsight =
    engDs === "empty"
      ? "저장된 스냅샷에서 좋아요·댓글 비율이 없습니다. 원인은 참여 메트릭 미기록입니다. 의미는 시청 반응 강도를 수치화할 수 없음을 뜻합니다. 행동은 avgLikeRatio·avgCommentRatio가 채워진 스냅샷을 확보한 뒤 동일 카드를 갱신하는 것입니다."
      : `저장된 표본에서 평균 좋아요 비율은 ${likeR != null ? formatPercentRatio(likeR) : "미기록"}, 평균 댓글 비율은 ${comR != null ? formatPercentRatio(comR) : "미기록"}입니다. 원인은 스냅샷에 집계된 반응 비율입니다. 의미는 조회 대비 상호작용 비중을 볼 수 있다는 점입니다. 행동은 다음 분석에서 동일 비율을 비교해 변화폭을 확인하는 것입니다.`;

  cards.push({
    id: "engagement",
    title: "참여율",
    value: engValue,
    state: engDs === "empty" ? "normal" : engState,
    insight: engInsight,
    confidence: clampConfidence(baseConfidence, engDs),
    dataStatus: engDs,
  });

  const dur = metrics?.avgVideoDuration ?? null;
  const durValue = dur != null ? formatDurationSeconds(dur) : "—";
  const durDs = cardDataStatus(dur != null, dur != null);
  const durState = scoreDurationState(dur);
  const durInsight =
    durDs === "empty"
      ? "저장된 스냅샷에서 평균 영상 길이(초)가 없습니다. 원인은 길이 메트릭 미기록입니다. 의미는 포맷 길이를 설명할 수 없음을 뜻합니다. 행동은 avgVideoDuration이 포함된 스냅샷을 생성한 뒤 재평가하는 것입니다."
      : `저장된 표본에서 평균 영상 길이는 ${formatDurationSeconds(dur!)}에 해당합니다. 원인은 표본 영상 durationSeconds의 평균입니다. 의미는 현재 업로드 포맷의 대표 길이를 수치로 본다는 점입니다. 행동은 다음 스냅샷과 길이 분포를 비교해 편집·기획 변경 효과를 확인하는 것입니다.`;

  cards.push({
    id: "video_length",
    title: "영상 길이",
    value: durValue,
    state: durDs === "empty" ? "normal" : durState,
    insight: durInsight,
    confidence: clampConfidence(baseConfidence, durDs),
    dataStatus: durDs,
  });

  const patternValue =
    patterns.length > 0
      ? `${patterns.length}건 플래그`
      : weaknesses.length > 0
        ? `약점 ${weaknesses.length}건`
        : contentPatternSummary
          ? "요약 문자열 존재"
          : "—";
  const patternHasSome =
    patterns.length > 0 ||
    weaknesses.length > 0 ||
    contentPatternSummary != null;
  const patternHasAll = patterns.length > 0 && weaknesses.length > 0;
  const patternDs = cardDataStatus(patternHasAll, patternHasSome);
  const patternState: AnalysisCardState =
    weaknesses.length >= 2 ? "warning" : patterns.length >= 1 ? "normal" : "normal";
  const patternHead =
    patterns.length > 0
      ? `저장된 스냅샷 패턴 플래그: ${patterns.slice(0, 5).join(", ")}`
      : weaknesses.length > 0
        ? `저장된 약점 문자열 중 일부: ${weaknesses.slice(0, 3).join("; ")}`
        : contentPatternSummary
          ? `저장된 콘텐츠 패턴 요약 일부: ${contentPatternSummary.slice(0, 120)}`
          : "";
  const patternInsight =
    patternDs === "empty"
      ? "저장된 스냅샷에서 패턴 플래그·약점·요약이 모두 없습니다. 원인은 텍스트·패턴 필드 미기록입니다. 의미는 콘텐츠 패턴 카드를 수치로 묶기 어렵다는 뜻입니다. 행동은 분석 결과에 patterns·weaknesses·content_pattern_summary가 채워지도록 한 뒤 동일 카드를 다시 생성하는 것입니다."
      : `${patternHead}. 원인은 분석 파이프라인이 기록한 패턴·약점 필드입니다. 의미는 저장된 진단 문장과 플래그를 동시에 볼 수 있다는 점입니다. 행동은 다음 분석에서 플래그 수·문장 변화를 비교해 편집·주제 변화를 추적하는 것입니다.`;

  cards.push({
    id: "pattern_analysis",
    title: "패턴 분석",
    value: patternValue,
    state: patternState,
    insight: patternInsight,
    confidence: clampConfidence(baseConfidence, patternDs),
    dataStatus: patternDs,
  });

  const titleL = metrics?.avgTitleLength ?? null;
  const tagC = metrics?.avgTagCount ?? null;
  const structValue =
    titleL != null && tagC != null
      ? `제목 ${formatInt(titleL)}자 · 태그 ${formatInt(tagC)}개`
      : titleL != null
        ? `제목 ${formatInt(titleL)}자`
        : tagC != null
          ? `태그 ${formatInt(tagC)}개`
          : "—";
  const structHasSome = titleL != null || tagC != null;
  const structHasAll = titleL != null && tagC != null;
  const structDs = cardDataStatus(structHasAll, structHasSome);
  const structState: AnalysisCardState =
    titleL != null && titleL < 20
      ? "warning"
      : tagC != null && tagC < 3
        ? "warning"
        : structHasAll
          ? "good"
          : "normal";
  const structInsight =
    structDs === "empty"
      ? "저장된 스냅샷에서 평균 제목 길이·태그 수가 없습니다. 원인은 콘텐츠 구조 메트릭 미기록입니다. 의미는 메타 필드 길이를 설명할 수 없음을 뜻합니다. 행동은 avgTitleLength·avgTagCount가 포함된 스냅샷을 확보한 뒤 동일 카드를 갱신하는 것입니다."
      : `저장된 표본에서 평균 제목 길이는 ${titleL != null ? `${formatInt(titleL)}자` : "미기록"}, 평균 태그 수는 ${tagC != null ? `${formatInt(tagC)}개` : "미기록"}입니다. 원인은 스냅샷에 집계된 메타 길이·태그 수입니다. 의미는 검색·클릭에 쓰이는 텍스트 자원의 평균 수준을 본다는 점입니다. 행동은 다음 분석에서 동일 지표를 비교해 메타 편집 효과를 확인하는 것입니다.`;

  cards.push({
    id: "content_meta",
    title: "콘텐츠 메타(제목·태그)",
    value: structValue,
    state: structDs === "empty" ? "normal" : structState,
    insight: structInsight,
    confidence: clampConfidence(baseConfidence, structDs),
    dataStatus: structDs,
  });

  const overallDataStatus = deriveOverallDataStatus(cards, sampleVideoCount);
  const overallConfidence = clampConfidence(baseConfidence, overallDataStatus);
  const summary = buildSummaryVm(
    cards,
    sampleVideoCount,
    overallDataStatus,
    overallConfidence
  );
  const confidenceReasons = buildConfidenceReasons(
    overallConfidence,
    overallDataStatus,
    sampleVideoCount
  );

  return {
    cards,
    summary,
    confidenceReasons,
    overallDataStatus,
    overallConfidence,
    resultId: typeof data.id === "string" ? data.id : null,
    sampleVideoCount,
  };
}
