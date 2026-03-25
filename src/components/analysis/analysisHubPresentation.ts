/**
 * /analysis 원천 데이터 허브 — 표현 전용. props·스냅샷에 이미 있는 값만 조합합니다.
 */
import type { AnalysisReportCompareVm } from "@/lib/analysis/analysisReportFields";
import type { AnalysisVideoRow } from "@/lib/analysis/analysisPageViewModel";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";

export type HubCardTone = "good" | "warning" | "critical" | "neutral";

export type HubMetricCardVm = {
  id: string;
  title: string;
  primaryValue: string;
  statusLabel: string;
  tone: HubCardTone;
  detailLines: string[];
  /** 0–100 정규화, 최근 영상 조회 흐름 미니 막대용 */
  miniBars?: number[];
};

function toneFromScore(score: number): HubCardTone {
  if (score >= 62) return "good";
  if (score >= 42) return "warning";
  return "critical";
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

/** 상위 20% 진입 최소 조회수(표본 내) */
export function top20ThresholdViews(videos: AnalysisVideoRow[]): number | null {
  const views = videos
    .map((v) => v.viewCount)
    .filter((v): v is number => v != null && Number.isFinite(v));
  if (views.length < 2) return null;
  const sorted = [...views].sort((a, b) => b - a);
  const idx = Math.max(0, Math.floor(sorted.length * 0.2) - 1);
  return sorted[idx] ?? null;
}

export function medianViews(videos: AnalysisVideoRow[]): number | null {
  const views = videos
    .map((v) => v.viewCount)
    .filter((v): v is number => v != null && Number.isFinite(v));
  if (views.length === 0) return null;
  const sorted = [...views].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/** 최근 N개 영상 조회 흐름: 전반 vs 후반 평균 변화율(%) */
export function viewFlowChangePercent(videos: AnalysisVideoRow[]): number | null {
  const withIdx = videos
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v.viewCount != null && Number.isFinite(x.v.viewCount));
  if (withIdx.length < 4) return null;
  const n = withIdx.length;
  const half = Math.floor(n / 2);
  const first = withIdx.slice(0, half);
  const second = withIdx.slice(half);
  const avg = (arr: typeof first) =>
    arr.reduce((s, x) => s + (x.v.viewCount ?? 0), 0) / arr.length;
  const a1 = avg(first);
  const a2 = avg(second);
  if (a1 <= 0) return null;
  return ((a2 - a1) / a1) * 100;
}

export function normalizedViewBars(videos: AnalysisVideoRow[], max = 8): number[] {
  const slice = videos.slice(0, max);
  const nums = slice.map((v) => (v.viewCount != null && v.viewCount >= 0 ? v.viewCount : 0));
  const m = Math.max(...nums, 1);
  return nums.map((v) => Math.round((v / m) * 100));
}

export function buildHubMetricCards(input: {
  metrics: ChannelMetrics | null;
  sectionScores: Record<string, number> | null;
  recentVideos: AnalysisVideoRow[];
  reportCompare: AnalysisReportCompareVm | null;
}): HubMetricCardVm[] {
  const { metrics, sectionScores, recentVideos, reportCompare } = input;
  const ca = sectionScores?.channelActivity;
  const ar = sectionScores?.audienceResponse;
  const cs = sectionScores?.contentStructure;

  const cards: HubMetricCardVm[] = [];

  // 1) 업로드 빈도
  const r30 = metrics?.recent30dUploadCount;
  const weekly =
    r30 != null && Number.isFinite(r30) ? r30 / 4 : null;
  const uploadTone =
    ca != null ? toneFromScore(ca) : r30 != null && r30 >= 1 ? "good" : "neutral";
  cards.push({
    id: "upload_freq",
    title: "최근 업로드 빈도",
    primaryValue:
      r30 != null
        ? `30일 ${formatInt(r30)}건 · 주당 약 ${weekly != null ? weekly.toFixed(1) : "—"}건`
        : "최근 데이터 부족",
    statusLabel:
      ca != null
        ? ca >= 62
          ? "리듬 양호"
          : ca >= 42
            ? "보통"
            : "점검 필요"
        : "관찰 필요",
    tone: uploadTone,
    detailLines: [
      metrics?.avgUploadIntervalDays != null
        ? `평균 업로드 간격: ${metrics.avgUploadIntervalDays.toFixed(1)}일`
        : "간격 데이터 없음",
      "YouTube API·스냅샷 metrics 기준",
    ],
  });

  // 2) 조회 흐름 — 표본 영상 변화율 우선, 없으면 스냅샷 audienceResponse 점수 차
  let flowLabel: "상승" | "유지" | "하락" = "유지";
  let flowPrimary = "표본 부족 · 추정 불가";
  const localFlow = viewFlowChangePercent(recentVideos);
  if (localFlow != null) {
    flowLabel = localFlow > 3 ? "상승" : localFlow < -3 ? "하락" : "유지";
    flowPrimary = `평균 조회 변화 ${localFlow > 0 ? "+" : ""}${localFlow.toFixed(1)}% (${flowLabel})`;
  } else if (reportCompare?.previous) {
    const c = reportCompare.current.feature_section_scores?.audienceResponse;
    const p = reportCompare.previous.feature_section_scores?.audienceResponse;
    if (c != null && p != null) {
      const delta = c - p;
      flowLabel = delta > 3 ? "상승" : delta < -3 ? "하락" : "유지";
      flowPrimary = `반응 지표 ${delta > 0 ? "+" : ""}${delta.toFixed(0)}p (${flowLabel}) · 스냅샷 비교`;
    }
  }
  const bars = normalizedViewBars(recentVideos);
  cards.push({
    id: "view_flow",
    title: "최근 조회 흐름",
    primaryValue: flowPrimary,
    statusLabel: flowLabel,
    tone:
      flowLabel === "상승"
        ? "good"
        : flowLabel === "하락"
          ? "critical"
          : "neutral",
    detailLines: [
      reportCompare?.previous
        ? "이전 분석 스냅샷과의 점수·표본 시계열을 함께 참고"
        : "표본 영상 시계열(전반·후반) 기준 근사",
      "원천: statistics·저장 스냅샷",
    ],
    miniBars: bars.length >= 3 ? bars : undefined,
  });

  // 3) 구조 안정성
  const csScore = cs ?? null;
  const stable =
    csScore != null ? csScore >= 55 : metrics?.avgTitleLength != null && metrics?.avgVideoDuration != null;
  cards.push({
    id: "structure",
    title: "콘텐츠 구조 안정성",
    primaryValue:
      csScore != null
        ? `구간 점수 ${Math.round(csScore)}/100`
        : "점수 없음",
    statusLabel: stable ? "안정" : "불안정",
    tone: csScore != null ? toneFromScore(csScore) : "neutral",
    detailLines: [
      metrics?.avgTitleLength != null
        ? `제목 길이 분산(평균 ${formatInt(metrics.avgTitleLength)}자)`
        : "제목 길이 없음",
      metrics?.avgVideoDuration != null
        ? `영상 길이 분산(평균 ${Math.round(metrics.avgVideoDuration / 60)}분대)`
        : "길이 데이터 없음",
      metrics?.avgTagCount != null
        ? `메타·키워드 군집(태그 평균 ${metrics.avgTagCount.toFixed(1)}개)`
        : "태그 평균 없음",
    ],
  });

  // 4) 기준 성과선
  const avg = metrics?.avgViewCount;
  cards.push({
    id: "baseline",
    title: "기준 성과선",
    primaryValue: avg != null ? `${formatInt(Math.round(avg))} (표본 평균 조회)` : "데이터 부족",
    statusLabel: ar != null ? (ar >= 55 ? "기준선 상단" : "기준선 점검") : "참고",
    tone: ar != null ? toneFromScore(ar) : "neutral",
    detailLines: ["채널 내부 성과 비교용 기준(표본 평균)", "API·스냅샷 metrics"],
  });

  // 5) 보조 기준선
  const med = metrics?.medianViewCount ?? medianViews(recentVideos);
  const top20 = top20ThresholdViews(recentVideos);
  cards.push({
    id: "aux_baseline",
    title: "보조 기준선",
    primaryValue:
      med != null
        ? `중앙값 ${formatInt(Math.round(med))}`
        : "중앙값 없음",
    statusLabel: top20 != null ? `상위 20% 기준 ≥ ${formatInt(Math.round(top20))}` : "표본 부족",
    tone: "neutral",
    detailLines: [
      top20 != null
        ? `상위 20% 진입 기준(표본 내): ${formatInt(Math.round(top20))} 조회`
        : "고성과 기준 산출 불가",
      "평균 왜곡 보정·고성과 비교용",
    ],
  });

  return cards;
}

export function performanceBadgeShort(relativeBadge: string | null): string {
  if (!relativeBadge) return "평균권";
  if (relativeBadge.includes("높은")) return "상위";
  if (relativeBadge.includes("낮은")) return "하위";
  return "관찰 필요";
}

/** 제목·길이 기반 표현 전용 패턴 태그(추가 API 없음) */
export function deriveVideoPatternTags(row: AnalysisVideoRow): string[] {
  const tags: string[] = [];
  const len = row.title.length;
  if (len < 28) tags.push("짧은 제목");
  else if (len > 52) tags.push("긴 제목");
  else tags.push("중간 길이 제목");

  const d = row.durationLabel ?? "";
  const parts = d.split(":").map((p) => p.trim()).filter(Boolean);
  let seconds = 0;
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = Number(parts[2]);
    if ([h, m, s].every((x) => Number.isFinite(x))) seconds = h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if ([m, s].every((x) => Number.isFinite(x))) seconds = m * 60 + s;
  }
  if (seconds > 0) {
    if (seconds < 240) tags.push("숏 포맷");
    else if (seconds > 1200) tags.push("롱 포맷");
    else tags.push("미드 포맷");
  } else {
    tags.push("길이 미상");
  }
  return tags.slice(0, 3);
}

/** 성장 상태 / 병목 / 우선 점검 — 1~2문장 */
export function buildChannelStatusSummary(input: {
  sectionScores: Record<string, number> | null;
  metrics: ChannelMetrics | null;
}): string {
  const { sectionScores: ss, metrics: m } = input;
  const gm = ss?.growthMomentum;
  const ca = ss?.channelActivity;
  const ar = ss?.audienceResponse;
  const cs = ss?.contentStructure;

  const growth =
    gm == null
      ? "상태 산출 보류"
      : gm >= 65
        ? "초기 성장 신호"
        : gm >= 48
          ? "정체·유지"
          : "회복·가속 필요";

  let bottleneck = "병목: 종합 점검";
  if (ar != null && ca != null && ar < ca - 12) bottleneck = "가장 큰 병목: 조회·반응";
  else if (cs != null && cs < 48) bottleneck = "가장 큰 병목: 콘텐츠 구조";
  else if (ca != null && ca < 48) bottleneck = "가장 큰 병목: 업로드 리듬";

  let priority = "우선 점검: 표본·스냅샷 확인";
  if (m?.recent30dUploadCount === 0) priority = "우선 점검: 최근 업로드 공백";
  else if (m != null && m.recent30dUploadCount != null && m.recent30dUploadCount < 2)
    priority = "우선 점검: 업로드 빈도";

  return `${growth} · ${bottleneck} · ${priority}`;
}
