import type { AnalysisPageData, AnalysisResultRow } from "@/lib/analysis/getAnalysisPageData";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import { enrichRowScores } from "@/lib/server/analysis/mapAnalysisHistoryAndCompare";

/** 세 구간 요약 — 스냅샷만으로 판별 불가 시 null */
export type BenchmarkTriLevel = "low" | "medium" | "high";

export type InternalBenchmarkRadarVm = {
  readonly labels: readonly string[];
  /** 0–100 스케일, `feature_section_scores` 기반 */
  readonly channel: readonly number[];
  /** 동일 길이, 항상 50 — 구간 점수(0–100) 척도의 중립 기준선(내부 해석용) */
  readonly referenceMid: readonly number[];
};

/**
 * /channel-dna 내부 비교 전용 — `getAnalysisPageData`·`analysis_results.feature_snapshot` 범위만 사용.
 */
export type InternalBenchmarkSummaryVm = {
  readonly dataSourceNote: string;
  /** `user_channels.video_count` (있을 때만) */
  readonly totalVideosUsed: number | null;
  readonly totalVideosUsedBasis: "channel_row" | null;
  /** 스냅샷 `videos`/`sample_videos` 파싱 행 수(제목 있는 항목) */
  readonly recentVideosUsed: number;
  readonly medianViews: number | null;
  readonly averageViews: number | null;
  /** 표본 조회수 합계 대비 최고 1개 영상 비중 0–1 */
  readonly topPerformerShare: number | null;
  /** 표본 조회수 합계 대비 조회 상위 3개 합 비중 0–1(표본 3개 이상일 때만) */
  readonly top3Share: number | null;
  readonly uploadConsistencyLevel: BenchmarkTriLevel | null;
  readonly uploadConsistencyFallback: string | null;
  readonly performanceSpreadLevel: BenchmarkTriLevel | null;
  readonly performanceSpreadFallback: string | null;
  readonly breakoutDependencyLevel: BenchmarkTriLevel | null;
  readonly breakoutDependencyFallback: string | null;
  /** 예: "짧은 폼(추정)", 스냅샷 기반 */
  readonly dominantFormat: string | null;
  readonly dominantFormatFallback: string | null;
  readonly topPatternSignals: readonly string[];
  readonly weakPatternSignals: readonly string[];
  readonly benchmarkNarrative: string;
  readonly radarProfile: InternalBenchmarkRadarVm | null;
  readonly sectionScoresLine: string | null;
};

type SnapshotVideo = {
  title: string;
  publishedAt: string | null;
  viewCount: number | null;
  durationSeconds: number | null;
};

type SectionScores = {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

function extractMetrics(snapshot: unknown): Partial<Record<keyof ChannelMetrics, number>> | null {
  if (!isRecord(snapshot)) {
    return null;
  }
  const raw = snapshot.metrics;
  if (!isRecord(raw)) {
    return null;
  }
  return raw as Partial<Record<keyof ChannelMetrics, number>>;
}

function extractPatternStrings(snapshot: unknown): string[] {
  if (!isRecord(snapshot)) {
    return [];
  }
  const raw = snapshot.patterns;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

function parseSnapshotVideos(snapshot: unknown): SnapshotVideo[] {
  if (!isRecord(snapshot)) {
    return [];
  }
  const raw = snapshot.videos ?? snapshot.sample_videos;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: SnapshotVideo[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) {
      continue;
    }
    const publishedAt =
      typeof item.publishedAt === "string"
        ? item.publishedAt
        : typeof item.published_at === "string"
          ? item.published_at
          : null;
    const viewCount =
      typeof item.viewCount === "number"
        ? item.viewCount
        : typeof item.view_count === "number"
          ? item.view_count
          : null;
    const durationSeconds =
      typeof item.durationSeconds === "number" && Number.isFinite(item.durationSeconds)
        ? item.durationSeconds
        : null;
    out.push({ title, publishedAt, viewCount, durationSeconds });
  }
  return out;
}

function medianSorted(sorted: number[]): number | null {
  if (sorted.length === 0) {
    return null;
  }
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? null;
  }
  const a = sorted[mid - 1];
  const b = sorted[mid];
  if (a == null || b == null) {
    return null;
  }
  return (a + b) / 2;
}

function meanStd(values: number[]): { mean: number; std: number } | null {
  if (values.length === 0) {
    return null;
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (values.length === 1) {
    return { mean, std: 0 };
  }
  let varSum = 0;
  for (const v of values) {
    const d = v - mean;
    varSum += d * d;
  }
  const std = Math.sqrt(varSum / (values.length - 1));
  return { mean, std };
}

function parseSectionScores(raw: unknown): SectionScores | null {
  if (!isRecord(raw)) {
    return null;
  }
  const keys: (keyof SectionScores)[] = [
    "channelActivity",
    "audienceResponse",
    "contentStructure",
    "seoOptimization",
    "growthMomentum",
  ];
  const out: Partial<SectionScores> = {};
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = Math.max(0, Math.min(100, v));
    }
  }
  if (
    out.channelActivity == null &&
    out.audienceResponse == null &&
    out.contentStructure == null &&
    out.seoOptimization == null &&
    out.growthMomentum == null
  ) {
    return null;
  }
  return {
    channelActivity: out.channelActivity ?? 0,
    audienceResponse: out.audienceResponse ?? 0,
    contentStructure: out.contentStructure ?? 0,
    seoOptimization: out.seoOptimization ?? 0,
    growthMomentum: out.growthMomentum ?? 0,
  };
}

function triFromUploadInterval(days: number): BenchmarkTriLevel {
  if (days <= 5) {
    return "high";
  }
  if (days <= 14) {
    return "medium";
  }
  return "low";
}

function triFromCv(cv: number): BenchmarkTriLevel {
  if (cv < 0.45) {
    return "low";
  }
  if (cv < 0.9) {
    return "medium";
  }
  return "high";
}

function triFromTopShare(share: number): BenchmarkTriLevel {
  if (share >= 0.5) {
    return "high";
  }
  if (share >= 0.32) {
    return "medium";
  }
  return "low";
}

/** 상위 3개 조회 합 비중 — 단일 히트 지표보다 완만한 임계값 */
function triFromTopThreeShare(share: number): BenchmarkTriLevel {
  if (share >= 0.55) {
    return "high";
  }
  if (share >= 0.38) {
    return "medium";
  }
  return "low";
}

function formatDominantFromAvgSeconds(sec: number): string {
  if (sec < 180) {
    return "짧은 폼 중심(표본 평균 길이 기준)";
  }
  if (sec < 600) {
    return "중간 길이 중심(표본 평균 길이 기준)";
  }
  return "긴 폼 중심(표본 평균 길이 기준)";
}

function buildNarrative(args: {
  recentVideosUsed: number;
  medianViews: number | null;
  averageViews: number | null;
  spreadLevel: BenchmarkTriLevel | null;
  breakoutLevel: BenchmarkTriLevel | null;
  uploadLevel: BenchmarkTriLevel | null;
  top3Share: number | null;
  topPerformerShare: number | null;
  topSignals: readonly string[];
  weakSignals: readonly string[];
}): string {
  const parts: string[] = [];
  if (args.recentVideosUsed === 0) {
    parts.push(
      "최근 표본 영상 목록이 스냅샷에 없어 조회 분포·편차·히트 의존도를 수치화하지 못했습니다. 베이스 분석 스냅샷에 영상 표본이 있으면 이 페이지에서 같은 항목을 조금 더 채울 수 있습니다."
    );
  } else {
    parts.push(
      `최근 분석 스냅샷의 표본 영상 ${args.recentVideosUsed}개만을 기준으로 내부 편차를 봅니다. 채널 전체가 아닌 저장된 표본에 한정되므로 해석이 제한될 수 있습니다.`
    );
    if (args.medianViews != null && args.averageViews != null) {
      parts.push(
        `표본 조회수 중앙값은 약 ${Math.round(args.medianViews).toLocaleString("ko-KR")}, 평균은 약 ${Math.round(args.averageViews).toLocaleString("ko-KR")}입니다.`
      );
    }
    if (args.spreadLevel === "high") {
      parts.push("표본 내 조회수 편차가 커 보이며, 성과가 일부 영상 쪽으로 집중되어 있을 수 있습니다.");
    } else if (args.spreadLevel === "medium") {
      parts.push("조회수 편차는 중간 수준으로 보입니다.");
    } else if (args.spreadLevel === "low") {
      parts.push("표본 내 조회수 편차는 비교적 작게 보이며, 분포는 상대적으로 안정적으로 읽힙니다.");
    }
    if (args.breakoutLevel != null) {
      if (args.top3Share != null) {
        if (args.breakoutLevel === "high") {
          parts.push(
            "표본 조회 합에서 상위 3개 영상이 차지하는 비중이 커 보여, 조회가 소수 영상에 집중되어 있습니다."
          );
        } else if (args.breakoutLevel === "medium") {
          parts.push("상위 3개 조회 비중은 중간 수준으로, 어느 정도 편차가 있습니다.");
        } else {
          parts.push("상위 3개에 조회가 과도하게 몰리지 않는 편으로 보입니다.");
        }
      } else if (args.topPerformerShare != null) {
        if (args.breakoutLevel === "high") {
          parts.push(
            "표본이 3개 미만이라 상위 3개 비중은 보지 않았고, 상위 1개 조회 비중만 보면 한 편에 조회가 집중되어 있습니다."
          );
        } else if (args.breakoutLevel === "medium") {
          parts.push(
            "표본이 3개 미만이라 상위 3개 비중은 보지 않았고, 상위 1개 기준으로는 편차가 중간 수준으로 보입니다."
          );
        } else {
          parts.push(
            "표본이 3개 미만이라 상위 3개 비중은 보지 않았고, 상위 1개 기준으로는 조회가 한곳에만 몰리지 않는 편으로 보입니다."
          );
        }
      }
    }
    if (args.uploadLevel === "high") {
      parts.push("업로드 간격은 비교적 안정적으로 보입니다.");
    } else if (args.uploadLevel === "medium") {
      parts.push("업로드 간격에는 어느 정도 편차가 있습니다.");
    } else if (args.uploadLevel === "low") {
      parts.push("업로드 간격 편차가 크게 보입니다.");
    }
  }
  if (args.topSignals.length > 0) {
    parts.push(`베이스 진단에서 반복 언급된 문장: ${args.topSignals.slice(0, 4).join(" · ")}`);
  }
  if (args.weakSignals.length > 0) {
    parts.push(`주의·개선으로 기록된 문장: ${args.weakSignals.slice(0, 4).join(" · ")}`);
  }
  return parts.join(" ");
}

export function buildInternalBenchmarkSummary(
  data: AnalysisPageData | null
): InternalBenchmarkSummaryVm {
  const baseNote =
    "외부 경쟁 채널·시장 평균 데이터는 없습니다. 아래는 저장된 베이스 분석(`analysis_results`)의 `feature_snapshot`·구간 점수·문자열 진단만으로 계산한 내부 비교입니다.";

  if (!data?.selectedChannel || !data.latestResult) {
    return {
      dataSourceNote: baseNote,
      totalVideosUsed: null,
      totalVideosUsedBasis: null,
      recentVideosUsed: 0,
      medianViews: null,
      averageViews: null,
      topPerformerShare: null,
      top3Share: null,
      uploadConsistencyLevel: null,
      uploadConsistencyFallback:
        "베이스 분석 결과가 없어 업로드 일관성을 판정할 수 없습니다.",
      performanceSpreadLevel: null,
      performanceSpreadFallback:
        "베이스 분석 결과가 없어 성과 편차를 판정할 수 없습니다.",
      breakoutDependencyLevel: null,
      breakoutDependencyFallback:
        "베이스 분석 결과가 없어 히트 의존도를 판정할 수 없습니다.",
      dominantFormat: null,
      dominantFormatFallback:
        "베이스 분석 결과가 없어 포맷 추정을 하지 않습니다.",
      topPatternSignals: [],
      weakPatternSignals: [],
      benchmarkNarrative:
        "저장된 분석 스냅샷이 없습니다. /analysis에서 베이스 분석을 완료하면 이 페이지에 표본 기반 내부 비교를 표시할 수 있습니다.",
      radarProfile: null,
      sectionScoresLine: null,
    };
  }

  const rawRow = data.latestResult as AnalysisResultRow;
  const scoredRow = enrichRowScores(rawRow);
  const snapshot = rawRow.feature_snapshot;
  const videos = parseSnapshotVideos(snapshot);
  const metrics = extractMetrics(snapshot);
  const patterns = extractPatternStrings(snapshot);
  const strengths = safeStringArray(rawRow.strengths);
  const weaknesses = safeStringArray(rawRow.weaknesses);
  const bottlenecks = safeStringArray(rawRow.bottlenecks);

  const ch = data.selectedChannel;
  const totalVideosUsed =
    typeof ch.video_count === "number" && Number.isFinite(ch.video_count) && ch.video_count >= 0
      ? Math.round(ch.video_count)
      : null;

  const views = videos
    .map((v) => v.viewCount)
    .filter((v): v is number => v != null && Number.isFinite(v) && v >= 0);
  const sortedViews = [...views].sort((a, b) => a - b);

  let medianViews: number | null = null;
  let averageViews: number | null = null;
  if (sortedViews.length > 0) {
    medianViews = medianSorted(sortedViews);
    const sm = meanStd(sortedViews);
    averageViews = sm?.mean ?? null;
  }
  if (medianViews == null && metrics?.medianViewCount != null && Number.isFinite(metrics.medianViewCount)) {
    medianViews = metrics.medianViewCount;
  }
  if (averageViews == null && metrics?.avgViewCount != null && Number.isFinite(metrics.avgViewCount)) {
    averageViews = metrics.avgViewCount;
  }

  let topPerformerShare: number | null = null;
  let top3Share: number | null = null;
  const viewSum = sortedViews.length > 0 ? sortedViews.reduce((s, v) => s + v, 0) : 0;
  if (sortedViews.length >= 2 && viewSum > 0) {
    const maxV = sortedViews[sortedViews.length - 1];
    if (maxV != null) {
      topPerformerShare = maxV / viewSum;
    }
  }
  if (sortedViews.length >= 3 && viewSum > 0) {
    const n = sortedViews.length;
    const v1 = sortedViews[n - 3];
    const v2 = sortedViews[n - 2];
    const v3 = sortedViews[n - 1];
    if (v1 != null && v2 != null && v3 != null) {
      top3Share = (v1 + v2 + v3) / viewSum;
    }
  }

  let uploadConsistencyLevel: BenchmarkTriLevel | null = null;
  let uploadConsistencyFallback: string | null = null;
  if (metrics?.avgUploadIntervalDays != null && Number.isFinite(metrics.avgUploadIntervalDays)) {
    uploadConsistencyLevel = triFromUploadInterval(metrics.avgUploadIntervalDays);
  } else {
    const dates: number[] = [];
    for (const v of videos) {
      if (v.publishedAt) {
        const t = Date.parse(v.publishedAt);
        if (!Number.isNaN(t)) {
          dates.push(t);
        }
      }
    }
    dates.sort((a, b) => a - b);
    if (dates.length >= 3) {
      const gaps: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const prev = dates[i - 1];
        const cur = dates[i];
        if (prev != null && cur != null) {
          gaps.push((cur - prev) / (86400000));
        }
      }
      const gm = meanStd(gaps);
      if (gm && gm.mean > 0) {
        const cv = gm.std / gm.mean;
        uploadConsistencyLevel = cv < 0.55 ? "high" : cv < 1.1 ? "medium" : "low";
      } else {
        uploadConsistencyFallback =
          "표본 공개일 간격 데이터가 부족해 업로드 일관성 등급을 두지 않았습니다.";
      }
    } else {
      uploadConsistencyFallback =
        "스냅샷에 평균 업로드 간격(일)이 없고, 유효한 공개일이 3개 미만이어 공개일 간격의 변동(CV)으로도 추정하지 못했습니다.";
    }
  }

  let performanceSpreadLevel: BenchmarkTriLevel | null = null;
  let performanceSpreadFallback: string | null = null;
  if (sortedViews.length >= 3) {
    const m = meanStd(sortedViews);
    if (m && m.mean > 0) {
      performanceSpreadLevel = triFromCv(m.std / m.mean);
    }
  } else {
    performanceSpreadFallback =
      "조회수가 있는 표본이 3개 미만이라 성과 편차 등급을 두지 않았습니다.";
  }

  let breakoutDependencyLevel: BenchmarkTriLevel | null = null;
  let breakoutDependencyFallback: string | null = null;
  if (top3Share != null) {
    breakoutDependencyLevel = triFromTopThreeShare(top3Share);
  } else if (topPerformerShare != null) {
    breakoutDependencyLevel = triFromTopShare(topPerformerShare);
    if (sortedViews.length < 3) {
      breakoutDependencyFallback =
        "표본이 3개 미만이어 상위 3개 조회 비중은 계산하지 않았고, 상위 1개 조회 비중으로 등급을 보조했습니다.";
    }
  } else {
    breakoutDependencyFallback =
      "표본 조회 합계를 만들 수 없어 히트 의존도를 계산하지 못했습니다.";
  }

  let dominantFormat: string | null = null;
  let dominantFormatFallback: string | null = null;
  const durSamples = videos
    .map((v) => v.durationSeconds)
    .filter((d): d is number => d != null && Number.isFinite(d) && d > 0);
  if (durSamples.length > 0) {
    const avgD = durSamples.reduce((s, d) => s + d, 0) / durSamples.length;
    dominantFormat = formatDominantFromAvgSeconds(avgD);
  } else if (metrics?.avgVideoDuration != null && Number.isFinite(metrics.avgVideoDuration)) {
    dominantFormat = formatDominantFromAvgSeconds(metrics.avgVideoDuration);
  } else {
    dominantFormatFallback =
      "표본에 `durationSeconds`가 없고 `metrics.avgVideoDuration`도 없어 포맷을 추정하지 않았습니다.";
  }

  const topPatternSignals: string[] = [];
  for (const s of strengths) {
    if (topPatternSignals.length >= 6) {
      break;
    }
    topPatternSignals.push(s);
  }
  for (const p of patterns) {
    if (topPatternSignals.length >= 8) {
      break;
    }
    const line = `스냅샷 플래그: ${p}`;
    if (!topPatternSignals.includes(line)) {
      topPatternSignals.push(line);
    }
  }

  const weakPatternSignals: string[] = [];
  for (const w of weaknesses) {
    if (weakPatternSignals.length >= 6) {
      break;
    }
    weakPatternSignals.push(w);
  }
  for (const b of bottlenecks) {
    if (weakPatternSignals.length >= 8) {
      break;
    }
    if (!weakPatternSignals.includes(b)) {
      weakPatternSignals.push(b);
    }
  }

  const sections = parseSectionScores(scoredRow.feature_section_scores ?? null);
  let radarProfile: InternalBenchmarkRadarVm | null = null;
  let sectionScoresLine: string | null = null;
  if (sections) {
    const a = sections.channelActivity;
    const b = sections.audienceResponse;
    const c = sections.contentStructure;
    const d = sections.seoOptimization;
    const e = sections.growthMomentum;
    const balance = (a + b + c + d + e) / 5;
    const channel = [a, b, c, d, e, Math.round(balance * 10) / 10];
    const labels = ["활동", "반응", "구조", "SEO", "성장", "균형(5구간 평균)"] as const;
    radarProfile = {
      labels: [...labels],
      channel,
      referenceMid: channel.map(() => 50),
    };
    sectionScoresLine = `구간 점수(0–100): 활동 ${Math.round(a)} · 반응 ${Math.round(b)} · 구조 ${Math.round(c)} · SEO ${Math.round(d)} · 성장 ${Math.round(e)}`;
  }

  const benchmarkNarrative = buildNarrative({
    recentVideosUsed: videos.length,
    medianViews,
    averageViews,
    spreadLevel: performanceSpreadLevel,
    breakoutLevel: breakoutDependencyLevel,
    uploadLevel: uploadConsistencyLevel,
    top3Share,
    topPerformerShare,
    topSignals: topPatternSignals,
    weakSignals: weakPatternSignals,
  });

  return {
    dataSourceNote: baseNote,
    totalVideosUsed,
    totalVideosUsedBasis: totalVideosUsed != null ? "channel_row" : null,
    recentVideosUsed: videos.length,
    medianViews,
    averageViews,
    topPerformerShare,
    top3Share,
    uploadConsistencyLevel,
    uploadConsistencyFallback,
    performanceSpreadLevel,
    performanceSpreadFallback,
    breakoutDependencyLevel,
    breakoutDependencyFallback,
    dominantFormat,
    dominantFormatFallback,
    topPatternSignals,
    weakPatternSignals,
    benchmarkNarrative,
    radarProfile,
    sectionScoresLine,
  };
}

export function benchmarkTriLevelLabel(level: BenchmarkTriLevel | null): string {
  if (level == null) {
    return "판정 없음";
  }
  switch (level) {
    case "low":
      return "낮음";
    case "medium":
      return "중간";
    case "high":
      return "높음";
    default: {
      const _e: never = level;
      return _e;
    }
  }
}
