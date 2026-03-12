"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  StatusBadge,
  toStatusBadgeStatus,
} from "@/components/ui/StatusBadge";
import BenchmarkRadar from "@/components/analysis/BenchmarkRadar";
import NextTrend from "@/components/analysis/NextTrend";
import type { ChannelSizeTier, ConfidenceLevel } from "@/lib/analysis/engine/types";
import {
  computeAnalysisConfidence,
  computeMetricsCompleteness,
  type AnalysisConfidence,
} from "@/lib/analysis/confidence/computeAnalysisConfidence";

// ── Types ──

type SelectedChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analysis_requested_at?: string | null;
  last_analyzed_at?: string | null;
};

type AnalysisResult = {
  id: string;
  user_channel_id: string;

  status: string | null;
  sample_video_count: number | null;
  analysis_confidence: string | null;

  channel_summary: string | null;
  content_pattern_summary: string | null;

  content_patterns: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  recommended_topics: string[] | null;
  growth_action_plan: string[] | null;
  target_audience: string[] | null;

  interpretation_mode: string | null;
  sample_size_note: string | null;

  gemini_status: string | null;
  gemini_model: string | null;
  gemini_analyzed_at: string | null;

  feature_snapshot: Record<string, unknown> | null;
  feature_total_score: number | null;
  feature_section_scores: Record<string, number> | null;

  created_at: string | null;
};

type AnalysisReportViewProps = {
  selectedChannel: SelectedChannel;
  latestResult: AnalysisResult | null;
};

type ChannelMetrics = {
  avgViewCount: number;
  medianViewCount: number;
  avgLikeRatio: number;
  avgCommentRatio: number;
  avgVideoDuration: number;
  avgUploadIntervalDays: number;
  recent30dUploadCount: number;
  avgTitleLength: number;
  avgTagCount: number;
};

type PatternFlag =
  | "low_upload_frequency"
  | "irregular_upload_interval"
  | "short_video_dominant"
  | "long_video_dominant"
  | "high_view_variance"
  | "repeated_topic_pattern"
  | "low_tag_usage";

// ── Constants ──

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

const METRIC_META: Record<
  keyof ChannelMetrics,
  { label: string; description: string; format: (v: number) => string }
> = {
  avgViewCount: {
    label: "평균 조회수",
    description: "영상 평균 조회수",
    format: (v) => formatCompact(v),
  },
  medianViewCount: {
    label: "중간값 조회수",
    description: "조회수 중간값",
    format: (v) => formatCompact(v),
  },
  avgLikeRatio: {
    label: "좋아요 비율",
    description: "조회 대비 좋아요",
    format: (v) => `${(v * 100).toFixed(2)}%`,
  },
  avgCommentRatio: {
    label: "댓글 비율",
    description: "조회 대비 댓글",
    format: (v) => `${(v * 100).toFixed(3)}%`,
  },
  avgVideoDuration: {
    label: "평균 영상 길이",
    description: "평균 재생 시간",
    format: (v) => formatDuration(v),
  },
  avgUploadIntervalDays: {
    label: "업로드 간격",
    description: "평균 업로드 주기",
    format: (v) => `${v.toFixed(1)}일`,
  },
  recent30dUploadCount: {
    label: "최근 30일 업로드",
    description: "최근 한 달 업로드 수",
    format: (v) => `${Math.round(v)}개`,
  },
  avgTitleLength: {
    label: "평균 제목 길이",
    description: "제목 평균 글자 수",
    format: (v) => `${v.toFixed(0)}자`,
  },
  avgTagCount: {
    label: "평균 태그 수",
    description: "영상당 평균 태그",
    format: (v) => `${v.toFixed(1)}개`,
  },
};

const PATTERN_META: Record<PatternFlag, { label: string; tone: string }> = {
  low_upload_frequency: {
    label: "낮은 업로드 빈도",
    tone: "border-amber-300 bg-amber-50 text-amber-800",
  },
  irregular_upload_interval: {
    label: "불규칙한 업로드 주기",
    tone: "border-amber-300 bg-amber-50 text-amber-800",
  },
  short_video_dominant: {
    label: "숏폼 중심",
    tone: "border-sky-300 bg-sky-50 text-sky-800",
  },
  long_video_dominant: {
    label: "롱폼 중심",
    tone: "border-indigo-300 bg-indigo-50 text-indigo-800",
  },
  high_view_variance: {
    label: "높은 조회수 편차",
    tone: "border-rose-300 bg-rose-50 text-rose-800",
  },
  repeated_topic_pattern: {
    label: "반복 주제 패턴",
    tone: "border-violet-300 bg-violet-50 text-violet-800",
  },
  low_tag_usage: {
    label: "낮은 태그 활용",
    tone: "border-orange-300 bg-orange-50 text-orange-800",
  },
};

const CHANNEL_SIZE_TIER_META: Record<ChannelSizeTier, { label: string; className: string }> = {
  micro: {
    label: "Micro",
    className: "border-gray-300 bg-gray-50 text-gray-700",
  },
  small: {
    label: "Small",
    className: "border-sky-300 bg-sky-50 text-sky-700",
  },
  medium: {
    label: "Medium",
    className: "border-violet-300 bg-violet-50 text-violet-700",
  },
  large: {
    label: "Large",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
};

function getChannelSizeTier(subscriberCount: number | null | undefined): ChannelSizeTier {
  const count = subscriberCount ?? 0;
  if (count >= 100_000) return "large";
  if (count >= 10_000) return "medium";
  if (count >= 1_000) return "small";
  return "micro";
}

const SECTION_SCORE_LABELS: Record<string, string> = {
  channelActivity: "채널 활동",
  audienceResponse: "시청자 반응",
  contentStructure: "콘텐츠 구조",
  seoOptimization: "SEO 최적화",
  growthMomentum: "성장 모멘텀",
};

const SECTION_SCORE_COLORS: Record<string, string> = {
  channelActivity: "bg-blue-500",
  audienceResponse: "bg-emerald-500",
  contentStructure: "bg-violet-500",
  seoOptimization: "bg-amber-500",
  growthMomentum: "bg-rose-500",
};

// ── Formatters ──

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toLocaleString("ko-KR");
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}시간 ${rm}분`;
  }
  return `${m}분 ${s}초`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// ── Data helpers ──

function normalizeItems(items: string[] | null | undefined): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => {
      if (v.length === 0) return false;
      const key = v.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getConfidenceLevelLabel(level: ConfidenceLevel): string {
  if (level === "high") return "신뢰도 높음";
  if (level === "medium") return "신뢰도 보통";
  return "신뢰도 낮음";
}

function getConfidenceLevelClassName(level: ConfidenceLevel): string {
  if (level === "high") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (level === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function computeConfidenceFromSnapshot(
  snapshot: Record<string, unknown> | null,
  subscriberCount: number | null | undefined,
  sampleVideoCount: number | null | undefined
): AnalysisConfidence {
  const metricsRaw = snapshot && typeof snapshot === "object"
    ? snapshot.metrics as Record<string, unknown> | null
    : null;
  const patternsRaw = snapshot && typeof snapshot === "object"
    ? snapshot.patterns
    : null;

  const metricsCompleteness = computeMetricsCompleteness(metricsRaw);
  const patternCount = Array.isArray(patternsRaw) ? patternsRaw.length : 0;
  const snapshotSampleCount =
    snapshot && typeof snapshot === "object" && typeof snapshot.sampleVideoCount === "number"
      ? snapshot.sampleVideoCount
      : 0;
  const snapshotCollectedCount =
    snapshot && typeof snapshot === "object" && typeof snapshot.collectedVideoCount === "number"
      ? snapshot.collectedVideoCount
      : 0;

  const tier = getChannelSizeTier(subscriberCount);

  return computeAnalysisConfidence({
    sampleVideoCount: typeof sampleVideoCount === "number" ? sampleVideoCount : snapshotSampleCount,
    collectedVideoCount: snapshotCollectedCount,
    channelSizeTier: tier,
    metricsCompleteness,
    patternCount,
  });
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "지금 분석 가능";
  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}분`);
  return `${parts.join(" ")} 후 재분석 가능`;
}

function getCooldownBaseTime(
  selectedChannel: SelectedChannel,
  latestResult: AnalysisResult | null,
  localRequestedAt: string | null
): string | null {
  return (
    localRequestedAt ??
    selectedChannel.last_analysis_requested_at ??
    selectedChannel.last_analyzed_at ??
    latestResult?.gemini_analyzed_at ??
    latestResult?.created_at ??
    null
  );
}

function getCooldownState(
  selectedChannel: SelectedChannel,
  latestResult: AnalysisResult | null,
  localRequestedAt: string | null
): { isCooldownActive: boolean; remainingText: string; nextAvailableAtText: string } {
  const baseTime = getCooldownBaseTime(selectedChannel, latestResult, localRequestedAt);
  if (!baseTime) {
    return { isCooldownActive: false, remainingText: "지금 분석 가능", nextAvailableAtText: "지금" };
  }
  const baseDate = new Date(baseTime);
  if (Number.isNaN(baseDate.getTime())) {
    return { isCooldownActive: false, remainingText: "지금 분석 가능", nextAvailableAtText: "지금" };
  }
  const nextAvailableAt = new Date(baseDate.getTime() + COOLDOWN_MS);
  const remainingMs = nextAvailableAt.getTime() - Date.now();
  const isCooldownActive = remainingMs > 0;
  return {
    isCooldownActive,
    remainingText: isCooldownActive ? formatRemaining(remainingMs) : "지금 분석 가능",
    nextAvailableAtText: formatDateTime(nextAvailableAt.toISOString()),
  };
}

function extractMetrics(snapshot: Record<string, unknown> | null): ChannelMetrics | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = snapshot.metrics;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const keys: (keyof ChannelMetrics)[] = [
    "avgViewCount", "medianViewCount", "avgLikeRatio", "avgCommentRatio",
    "avgVideoDuration", "avgUploadIntervalDays", "recent30dUploadCount",
    "avgTitleLength", "avgTagCount",
  ];
  const hasAny = keys.some((k) => typeof m[k] === "number");
  if (!hasAny) return null;
  return {
    avgViewCount: typeof m.avgViewCount === "number" ? m.avgViewCount : 0,
    medianViewCount: typeof m.medianViewCount === "number" ? m.medianViewCount : 0,
    avgLikeRatio: typeof m.avgLikeRatio === "number" ? m.avgLikeRatio : 0,
    avgCommentRatio: typeof m.avgCommentRatio === "number" ? m.avgCommentRatio : 0,
    avgVideoDuration: typeof m.avgVideoDuration === "number" ? m.avgVideoDuration : 0,
    avgUploadIntervalDays: typeof m.avgUploadIntervalDays === "number" ? m.avgUploadIntervalDays : 0,
    recent30dUploadCount: typeof m.recent30dUploadCount === "number" ? m.recent30dUploadCount : 0,
    avgTitleLength: typeof m.avgTitleLength === "number" ? m.avgTitleLength : 0,
    avgTagCount: typeof m.avgTagCount === "number" ? m.avgTagCount : 0,
  };
}

function extractPatterns(snapshot: Record<string, unknown> | null): PatternFlag[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const raw = snapshot.patterns;
  if (!Array.isArray(raw)) return [];
  const valid = Object.keys(PATTERN_META);
  return raw.filter((f): f is PatternFlag => typeof f === "string" && valid.includes(f));
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "우수";
  if (score >= 40) return "보통";
  return "개선 필요";
}

// ── Reusable UI primitives ──

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}): JSX.Element {
  return (
    <div className="mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        {title}
      </h2>
      <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function GroupDivider({ title, subtitle }: { title: string; subtitle: string }): JSX.Element {
  return (
    <div className="relative pt-2">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <h2 className="pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        {title}
      </h2>
      <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
          {icon ? <span className="text-base">{icon}</span> : null}
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function List({
  items,
  emptyText = "분석 데이터가 충분하지 않아 인사이트를 생성하지 못했습니다.",
}: {
  items: string[] | null;
  emptyText?: string;
}): JSX.Element {
  const safe = normalizeItems(items);
  if (safe.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400">
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {safe.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800"
        >
          <span className="mt-[9px] block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400">
      {message}
    </p>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 transition-shadow hover:shadow-md sm:p-4">
      <p className="text-[11px] font-medium text-gray-500 sm:text-xs">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-gray-900 sm:mt-1.5 sm:text-xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-400 sm:mt-1 sm:text-xs">{description}</p>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  colorClass,
}: {
  label: string;
  score: number;
  colorClass: string;
}): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">{clamped}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function PatternBadge({ flag }: { flag: PatternFlag }): JSX.Element {
  const meta = PATTERN_META[flag];
  if (!meta) return <></>;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

// ── Main component ──

export default function AnalysisReportView({
  selectedChannel,
  latestResult,
}: AnalysisReportViewProps): JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [localRequestedAt, setLocalRequestedAt] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);

  const cooldown = useMemo(
    () => getCooldownState(selectedChannel, latestResult, localRequestedAt),
    [selectedChannel, latestResult, localRequestedAt]
  );

  const metrics = useMemo(
    () => (latestResult ? extractMetrics(latestResult.feature_snapshot) : null),
    [latestResult]
  );

  const patterns = useMemo(
    () => (latestResult ? extractPatterns(latestResult.feature_snapshot) : []),
    [latestResult]
  );

  const confidence = useMemo(
    () =>
      latestResult
        ? computeConfidenceFromSnapshot(
            latestResult.feature_snapshot,
            selectedChannel.subscriber_count,
            latestResult.sample_video_count
          )
        : null,
    [latestResult, selectedChannel.subscriber_count]
  );

  if (!latestResult) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        아직 분석 결과가 없습니다.
      </section>
    );
  }

  const isAnalyzed =
    latestResult.status === "analyzed" || latestResult.gemini_status === "success";

  const isBackendRunning =
    latestResult.status === "queued" ||
    latestResult.status === "processing" ||
    latestResult.status === "running" ||
    latestResult.gemini_status === "processing";

  const isRequestLocked =
    isSubmitting || isRefreshing || localPending || isBackendRunning || cooldown.isCooldownActive;

  const analyzedAt = formatDateTime(latestResult.gemini_analyzed_at ?? latestResult.created_at);
  const confidenceLevel = confidence?.confidenceLevel ?? "low";
  const confidenceLabel = getConfidenceLevelLabel(confidenceLevel);
  const confidenceClassName = getConfidenceLevelClassName(confidenceLevel);

  const totalScore = latestResult.feature_total_score;
  const sectionScores = latestResult.feature_section_scores;

  function getRequestButtonLabel(): string {
    if (isSubmitting) return "분석 요청 중...";
    if (isRefreshing) return "상태 반영 중...";
    if (localPending) return "분석 요청됨";
    if (isBackendRunning) return "분석 진행 중";
    if (cooldown.isCooldownActive) return "72시간 쿨다운 적용 중";
    if (latestResult?.status === "failed" || latestResult?.gemini_status === "failed") {
      return "다시 분석 요청";
    }
    return "지금 다시 분석";
  }

  async function handleRequestAnalysis(): Promise<void> {
    if (isRequestLocked) return;
    try {
      setIsSubmitting(true);
      setRequestError(null);
      setRequestMessage(null);
      const res = await fetch("/api/analysis/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_channel_id: selectedChannel.id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "분석 요청에 실패했습니다.");
      }
      const nowIso = new Date().toISOString();
      setLocalRequestedAt(nowIso);
      setLocalPending(true);
      setRequestMessage("분석 요청이 접수되었습니다. 결과가 반영되면 최신 리포트로 갱신됩니다.");
      startTransition(() => { router.refresh(); });
    } catch (error: unknown) {
      const message =
        error instanceof Error && typeof error.message === "string"
          ? error.message
          : "분석 요청에 실패했습니다.";
      setRequestError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ═══ Channel Header ═══ */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            {selectedChannel.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedChannel.thumbnail_url}
                alt={selectedChannel.channel_title ?? "channel"}
                className="h-14 w-14 rounded-full border border-black/5 object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-base font-semibold text-gray-500 sm:h-16 sm:w-16">
                {(selectedChannel.channel_title ?? "C").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">채널 리포트</p>
              <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {selectedChannel.channel_title ?? "채널명 없음"}
              </h1>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
                <span>구독자 {formatNumber(selectedChannel.subscriber_count)}명</span>
                {(() => {
                  const tier = getChannelSizeTier(selectedChannel.subscriber_count);
                  const meta = CHANNEL_SIZE_TIER_META[tier];
                  return (
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  );
                })()}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={toStatusBadgeStatus(latestResult.status, latestResult.gemini_status)}
              />
              <span
                className={`group relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClassName}`}
              >
                {confidenceLabel}
                {confidence ? (
                  <span className="tabular-nums">({confidence.confidenceScore})</span>
                ) : null}

                {confidence && confidence.reasons.length > 0 ? (
                  <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded-xl border border-gray-200 bg-white p-3 text-left text-xs font-normal text-gray-700 shadow-lg group-hover:block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      신뢰도 근거
                    </span>
                    {confidence.reasons.map((r, i) => (
                      <span key={i} className="mb-1 block leading-relaxed">{r}</span>
                    ))}
                    <span className="mt-2 block border-t border-gray-100 pt-2 text-[10px] text-gray-400">
                      분석 신뢰도는 데이터 표본과 지표 완전성을 기반으로 계산됩니다.
                    </span>
                  </span>
                ) : null}
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-2 lg:items-end">
              <button
                type="button"
                onClick={handleRequestAnalysis}
                disabled={isRequestLocked}
                className={[
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                  isRequestLocked
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-gray-900 text-white hover:bg-gray-800",
                ].join(" ")}
              >
                {getRequestButtonLabel()}
              </button>

              <div className="min-h-[20px] text-sm">
                {requestError ? (
                  <p className="text-red-600">{requestError}</p>
                ) : requestMessage ? (
                  <p className="text-emerald-600">{requestMessage}</p>
                ) : cooldown.isCooldownActive ? (
                  <p className="text-amber-700">
                    {cooldown.remainingText} · 다음 가능 시각 {cooldown.nextAvailableAtText}
                  </p>
                ) : isBackendRunning ? (
                  <p className="text-gray-600">현재 분석이 진행 중입니다.</p>
                ) : (
                  <p className="text-gray-500">
                    새 분석을 요청하면 최신 데이터로 다시 리포트를 생성합니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">최근 분석 시각</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{analyzedAt}</p>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">분석 영상 수</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(latestResult.sample_video_count)}개
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">분석 모델</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {latestResult.gemini_model ?? "-"}
            </p>
          </div>
        </div>

        {latestResult.sample_size_note ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            {latestResult.sample_size_note}
          </div>
        ) : null}
      </section>

      {!isAnalyzed ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700 shadow-sm">
          분석 진행 중입니다. 잠시 후 페이지를 새로고침해주세요.
        </section>
      ) : (
        <>
          {/* ═══ Data Overview ═══ */}

          {/* Channel Metrics */}
          {metrics ? (
            <section>
              <SectionHeader
                title="Channel Metrics"
                subtitle="최근 분석 영상 기반의 핵심 수치입니다."
              />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                {(Object.keys(METRIC_META) as (keyof ChannelMetrics)[]).map((key) => {
                  const meta = METRIC_META[key];
                  return (
                    <MetricCard
                      key={key}
                      label={meta.label}
                      value={meta.format(metrics[key])}
                      description={meta.description}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Channel Score */}
          {totalScore != null && sectionScores ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                title="Channel Score"
                subtitle="5개 영역의 종합 채널 점수입니다."
              />
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col items-center justify-center lg:w-40">
                  <span className={`text-5xl font-extrabold tabular-nums ${getScoreColor(totalScore)}`}>
                    {Math.round(totalScore)}
                  </span>
                  <span className={`mt-1 text-sm font-semibold ${getScoreColor(totalScore)}`}>
                    {getScoreLabel(totalScore)}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400">종합 점수</span>
                </div>
                <div className="flex-1 space-y-3">
                  {Object.entries(sectionScores).map(([key, score]) => {
                    if (typeof score !== "number") return null;
                    return (
                      <ScoreBar
                        key={key}
                        label={SECTION_SCORE_LABELS[key] ?? key}
                        score={score}
                        colorClass={SECTION_SCORE_COLORS[key] ?? "bg-gray-500"}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {/* Benchmark Radar */}
          {metrics ? (
            <BenchmarkRadar metrics={metrics} />
          ) : null}

          {/* Detected Patterns */}
          <section>
            <SectionHeader
              title="Detected Patterns"
              subtitle="분석 데이터에서 감지된 채널 패턴입니다."
            />
            {patterns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patterns.map((flag) => (
                  <PatternBadge key={flag} flag={flag} />
                ))}
              </div>
            ) : (
              <EmptyState message="감지된 특이 패턴이 없습니다. 전반적으로 안정적인 채널 구조입니다." />
            )}
          </section>

          {/* ═══ AI Insights ═══ */}
          <GroupDivider
            title="AI Insights"
            subtitle="Gemini 분석 엔진이 생성한 인사이트입니다."
          />

          <Section title="채널 요약" icon="📋">
            {latestResult.channel_summary ? (
              <p className="text-sm leading-7 text-gray-800">
                {latestResult.channel_summary}
              </p>
            ) : (
              <EmptyState message="채널 요약을 생성하지 못했습니다." />
            )}
          </Section>

          <Section
            title="콘텐츠 패턴"
            icon="🔁"
            description={
              latestResult.content_pattern_summary ?? "반복적으로 보이는 콘텐츠 흐름입니다."
            }
          >
            <List
              items={latestResult.content_patterns}
              emptyText="콘텐츠 패턴을 분석하기에 데이터가 부족합니다."
            />
          </Section>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="강점" icon="💪">
              <List
                items={latestResult.strengths}
                emptyText="현재 데이터에서 뚜렷한 강점을 도출하지 못했습니다."
              />
            </Section>
            <Section title="약점" icon="⚠️">
              <List
                items={latestResult.weaknesses}
                emptyText="현재 데이터에서 뚜렷한 약점을 도출하지 못했습니다."
              />
            </Section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="병목 요인" icon="🚧">
              <List
                items={latestResult.bottlenecks}
                emptyText="뚜렷한 병목 요인이 감지되지 않았습니다."
              />
            </Section>
            <Section title="타겟 시청자" icon="🎯">
              <List
                items={latestResult.target_audience}
                emptyText="타겟 시청자 정보가 충분하지 않습니다."
              />
            </Section>
          </div>

          <Section title="추천 콘텐츠" icon="💡">
            <List
              items={latestResult.recommended_topics}
              emptyText="추천 콘텐츠 주제를 생성하지 못했습니다."
            />
          </Section>

          <Section title="성장 액션 플랜" icon="🚀">
            <List
              items={latestResult.growth_action_plan}
              emptyText="실행 가능한 액션 플랜을 생성하지 못했습니다."
            />
          </Section>

          {/* ═══ Strategy ═══ */}
          <GroupDivider
            title="Next Trend"
            subtitle="채널 데이터를 기반으로 향후 시도해볼 콘텐츠 방향입니다."
          />

          <NextTrend
            recommendedTopics={latestResult.recommended_topics}
            contentPatterns={latestResult.content_patterns}
            growthActionPlan={latestResult.growth_action_plan}
            targetAudience={latestResult.target_audience}
          />
        </>
      )}
    </div>
  );
}
