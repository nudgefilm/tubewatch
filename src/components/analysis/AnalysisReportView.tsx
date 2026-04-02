"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, TrendingUp, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StatusBadge,
  toStatusBadgeStatus,
} from "@/components/ui/StatusBadge";
import FirstAnalysisGuide from "@/components/analysis/FirstAnalysisGuide";
import { AnalysisReportSkeleton } from "@/components/ui/SkeletonCard";
import type { ConfidenceLevel } from "@/lib/analysis/engine/types";
import { formatDateTime } from "@/lib/format/formatDateTime";
import AnalysisHistoryList from "@/components/analysis/AnalysisHistoryList";
import type { AnalysisHistoryItem } from "@/components/analysis/AnalysisHistoryList";
import type { AnalysisViewModel } from "@/lib/analysis/analysisViewModel";
import type { AnalysisVideoRow } from "@/lib/analysis/analysisPageViewModel";
import type {
  AnalysisReportAiFieldsVm,
  AnalysisReportCompareVm,
  AnalysisReportPresentationVm,
} from "@/lib/analysis/analysisReportFields";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import type { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";
import AnalysisShell from "@/components/analysis/AnalysisShell";
import {
  buildChannelStatusSummary,
  buildHubMetricCards,
  deriveVideoPatternTags,
  performanceBadgeShort,
  type HubMetricCardVm,
} from "@/components/analysis/analysisHubPresentation";

// ── Types (props 계약 유지) ──

type SelectedChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  video_count: number | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analysis_requested_at?: string | null;
  last_analyzed_at?: string | null;
};

type AnalysisReportViewProps = {
  channels: UserChannelRow[];
  selectedChannel: SelectedChannel;
  reportPresentation: AnalysisReportPresentationVm | null;
  reportCompare: AnalysisReportCompareVm | null;
  aiInsightFields: AnalysisReportAiFieldsVm | null;
  isAdmin?: boolean;
  analysisHistory?: AnalysisHistoryItem[];
  snapshotMetricsForRadar: ChannelMetrics | null;
  analysisViewModel: AnalysisViewModel | null;
  /** analysisPageViewModel — 표현 전용, 추가 수집 없음 */
  headlineDiagnosis?: string | null;
  recentVideos?: AnalysisVideoRow[];
  topVideos?: AnalysisVideoRow[];
  weakVideos?: AnalysisVideoRow[];
  performanceCompareSummary?: string | null;
};

// ── v0-TubewatchUI analysis/page.tsx 복제 컴포넌트 ──

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [score]);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getGradeColor = (g: string) => {
    switch (g) {
      case "S":
        return "text-orange-500";
      case "A":
        return "text-green-500";
      case "B":
        return "text-blue-500";
      case "C":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="relative mx-auto h-72 w-72">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 256 256">
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-orange-500 transition-all duration-1000 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-7xl font-bold tracking-tight ${getGradeColor(grade)}`}>
          {grade}
        </span>
        <span className="mt-2 text-4xl font-bold text-foreground">{animatedScore}</span>
        <span className="mt-1 text-sm text-muted-foreground">TubeWatch 엔진 분석 종합 점수</span>
      </div>
    </div>
  );
}

function HubMetricCard({ vm }: { vm: HubMetricCardVm }): JSX.Element {
  const toneRing = {
    good: "border-emerald-500/25 bg-emerald-500/[0.04]",
    warning: "border-amber-500/25 bg-amber-500/[0.04]",
    critical: "border-red-500/25 bg-red-500/[0.04]",
    neutral: "border-border bg-card",
  }[vm.tone];

  return (
    <Card className={`border-2 ${toneRing}`}>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">{vm.title}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {vm.statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-lg font-bold leading-tight sm:text-xl">{vm.primaryValue}</p>
        {vm.miniBars && vm.miniBars.length >= 3 ? (
          <div className="flex h-12 items-end gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-2">
            {vm.miniBars.map((h, i) => (
              <div
                key={i}
                className="min-h-[6px] flex-1 rounded-sm bg-orange-500/80"
                style={{ height: `${Math.max(12, (h / 100) * 40)}px` }}
              />
            ))}
          </div>
        ) : null}
        <ul className="space-y-1 text-xs text-muted-foreground">
          {vm.detailLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ko-KR");
}

// ── Constants ──

const COOLDOWN_HOURS = 12;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// ── Formatters ──

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
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
  analysisTimestampIso: string | null,
  localRequestedAt: string | null
): string | null {
  return (
    localRequestedAt ??
    selectedChannel.last_analysis_requested_at ??
    selectedChannel.last_analyzed_at ??
    analysisTimestampIso ??
    null
  );
}

function getCooldownState(
  selectedChannel: SelectedChannel,
  analysisTimestampIso: string | null,
  localRequestedAt: string | null
): { isCooldownActive: boolean; remainingText: string; nextAvailableAtText: string } {
  const baseTime = getCooldownBaseTime(selectedChannel, analysisTimestampIso, localRequestedAt);
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

function scoreToGrade(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

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

// ── Appendix blocks ──

function AppendixSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="py-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function ListBlock({
  items,
  emptyText,
}: {
  items: string[] | null;
  emptyText: string;
}): JSX.Element {
  const safe = normalizeItems(items);
  if (safe.length === 0) {
    return <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {safe.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed"
        >
          <span className="mt-[9px] block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AdminResetPanel({
  userChannelId,
  onReset,
}: {
  userChannelId: string;
  onReset: () => void;
}): JSX.Element {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleReset(): Promise<void> {
    if (isResetting) return;
    try {
      setIsResetting(true);
      setResetMessage(null);

      const res = await fetch("/api/admin/reset-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_channel_id: userChannelId }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setResetMessage(json?.error ?? "리셋에 실패했습니다.");
        return;
      }

      setResetMessage("분석 상태가 초기화되었습니다. 즉시 재분석이 가능합니다.");
      onReset();
    } catch {
      setResetMessage("리셋 요청 중 오류가 발생했습니다.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">Admin Tools</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            분석 타임스탬프를 초기화하여 즉시 재분석을 허용합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {isResetting ? "초기화 중..." : "분석 리셋"}
        </button>
      </div>
      {resetMessage ? <p className="mt-2 text-xs text-muted-foreground">{resetMessage}</p> : null}
    </div>
  );
}

// ── Main ──

export default function AnalysisReportView({
  channels,
  selectedChannel,
  reportPresentation = null,
  reportCompare = null,
  aiInsightFields = null,
  isAdmin = false,
  analysisHistory = [],
  snapshotMetricsForRadar = null,
  analysisViewModel = null,
  headlineDiagnosis = null,
  recentVideos = [],
  topVideos = [],
  weakVideos = [],
  performanceCompareSummary = null,
}: AnalysisReportViewProps): JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [localRequestedAt, setLocalRequestedAt] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);

  const cooldown = useMemo(
    () =>
      getCooldownState(
        selectedChannel,
        reportPresentation?.analysisTimestampIso ?? null,
        localRequestedAt
      ),
    [selectedChannel, reportPresentation, localRequestedAt]
  );

  const metrics = snapshotMetricsForRadar;

  const hubCards = useMemo(
    () =>
      buildHubMetricCards({
        metrics,
        sectionScores: reportPresentation?.sectionScores ?? null,
        recentVideos,
        reportCompare,
      }),
    [metrics, reportPresentation?.sectionScores, recentVideos, reportCompare]
  );

  const channelStatusLine = useMemo(
    () =>
      buildChannelStatusSummary({
        sectionScores: reportPresentation?.sectionScores ?? null,
        metrics,
      }),
    [reportPresentation?.sectionScores, metrics]
  );

  if (!reportPresentation || !aiInsightFields) {
    return (
      <>
        <div className="relative mx-auto h-72 w-72 shrink-0" aria-hidden />
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
          <section className="py-12">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Channel Analysis</h1>
                <p className="mt-2 text-muted-foreground">
                  원천 데이터 허브 · TubeWatch 엔진 분석 기준선
                </p>
              </div>
              <FirstAnalysisGuide />
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="mx-auto max-w-sm">
                  <p className="text-3xl">📋</p>
                  <h2 className="mt-3 text-lg font-semibold">아직 분석 결과가 없습니다</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    분석 요청 후 결과가 표시됩니다. 분석에는 약 1~2분이 소요됩니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <></>
      </>
    );
  }

  const isAnalyzed =
    reportPresentation.status === "analyzed" || reportPresentation.geminiStatus === "success";

  const isBackendRunning =
    reportPresentation.status === "queued" ||
    reportPresentation.status === "processing" ||
    reportPresentation.status === "running" ||
    reportPresentation.geminiStatus === "processing";

  const isCooldownBlocked = isAdmin ? false : cooldown.isCooldownActive;

  const isRequestLocked =
    isSubmitting || isRefreshing || localPending || isBackendRunning || isCooldownBlocked;

  const analyzedAt = formatDateTime(reportPresentation.analysisTimestampIso ?? "");
  const confidenceLevelForHero: ConfidenceLevel = analysisViewModel?.overallConfidence ?? "low";
  const confidenceLabel = getConfidenceLevelLabel(confidenceLevelForHero);
  const confidenceClassName = getConfidenceLevelClassName(confidenceLevelForHero);

  const totalScore = reportPresentation.totalScore;
  const rawScore = typeof totalScore === "number" && !Number.isNaN(totalScore) ? totalScore : 0;
  const grade = scoreToGrade(Math.round(rawScore));

  const summarySubscribers = formatNumber(selectedChannel.subscriber_count);
  const summaryTotalVideos =
    selectedChannel.video_count != null
      ? formatNumber(selectedChannel.video_count)
      : formatNumber(reportPresentation.sampleVideoCount);
  const summaryUpload30 =
    metrics?.recent30dUploadCount != null
      ? formatNumber(metrics.recent30dUploadCount)
      : "—";

  function getRequestButtonLabel(): string {
    if (isSubmitting) return "분석 요청 중...";
    if (isRefreshing) return "상태 반영 중...";
    if (localPending) return "분석 요청됨";
    if (isBackendRunning) return "분석 진행 중";
    if (isCooldownBlocked) return "12시간 쿨다운 적용 중";
    if (
      reportPresentation?.status === "failed" ||
      reportPresentation?.geminiStatus === "failed"
    ) {
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
      startTransition(() => {
        router.refresh();
      });
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

  const gaugeNode = <ScoreGauge score={Math.round(rawScore)} grade={grade} />;

  const heroRightNode = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {selectedChannel.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedChannel.thumbnail_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
            {(selectedChannel.channel_title ?? "C").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {selectedChannel.channel_title ?? "채널명 없음"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Channel Analysis · 원천 데이터 허브 (TubeWatch 엔진 분석)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Users className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">구독자 (statistics)</p>
                <p className="text-lg font-bold">{summarySubscribers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Video className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">총 영상 수</p>
                <p className="text-lg font-bold">{summaryTotalVideos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 col-span-2 sm:col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">최근 30일 업로드 (playlist)</p>
                <p className="text-lg font-bold">{summaryUpload30}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {headlineDiagnosis ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium leading-relaxed text-foreground">
          <span className="text-muted-foreground">한줄 진단 · </span>
          {headlineDiagnosis}
        </p>
      ) : null}

      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5 text-sm leading-relaxed text-foreground">
        <span className="font-medium text-muted-foreground">채널 상태 요약 · </span>
        {channelStatusLine}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <StatusBadge
          status={toStatusBadgeStatus(reportPresentation.status, reportPresentation.geminiStatus)}
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${confidenceClassName}`}
        >
          {confidenceLabel}
        </span>
        <span className="hidden sm:inline">·</span>
        <span>최근 분석 시각: {analyzedAt}</span>
      </div>
      {(analysisViewModel?.confidenceReasons?.length ?? 0) > 0 ? (
        <p className="text-xs text-muted-foreground">
          신뢰도 근거: {analysisViewModel?.confidenceReasons.join(" · ")}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        데이터 소스: YouTube Data API{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">channels.list</code> ·{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">statistics</code> · 업로드 플레이리스트{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">publishedAt</code> 필터 · 표본{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">videos.list</code> / 내부 분석 메타
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={handleRequestAnalysis}
          disabled={isRequestLocked}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600"
        >
          {getRequestButtonLabel()}
        </Button>
        <div className="min-h-[20px] text-xs">
          {requestError ? (
            <p className="text-red-600">{requestError}</p>
          ) : requestMessage ? (
            <p className="text-emerald-600">{requestMessage}</p>
          ) : isAdmin && cooldown.isCooldownActive ? (
            <p className="text-indigo-600">Admin: 쿨다운 바이패스 · 즉시 재분석 가능</p>
          ) : isCooldownBlocked ? (
            <p className="text-amber-700">{cooldown.remainingText}</p>
          ) : isBackendRunning ? (
            <p className="text-muted-foreground">분석 진행 중</p>
          ) : (
            <p className="text-muted-foreground">메타 갱신: {analyzedAt}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">표본 영상 수</p>
            <p className="text-lg font-bold">{formatNumber(reportPresentation.sampleVideoCount)}개</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">다음 재분석</p>
            <p className="text-lg font-bold">
              {cooldown.isCooldownActive ? cooldown.nextAvailableAtText : "가능"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 col-span-2 sm:col-span-1">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">엔진</p>
            <p className="text-lg font-bold">TubeWatch 엔진 분석</p>
          </CardContent>
        </Card>
      </div>

      {analysisViewModel?.summary.sampleNote ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900">
          {analysisViewModel.summary.sampleNote}
        </div>
      ) : null}

      {isAdmin ? (
        <AdminResetPanel
          userChannelId={selectedChannel.id}
          onReset={() => {
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      ) : null}
    </div>
  );

  const mainRest = (
    <>
      {!isAnalyzed ? (
        <section className="py-12">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">분석이 진행 중입니다</p>
              <p className="mt-1 text-amber-800">
                데이터 수집과 TubeWatch 엔진 분석이 완료되면 아래에 리포트가 표시됩니다. 약 1~2분 후 페이지를 새로고침해 주세요.
              </p>
            </div>
            <AnalysisReportSkeleton />
          </div>
        </section>
      ) : (
        <>
          <section className="py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">핵심 진단 카드</h2>
                <p className="mt-1 text-muted-foreground">
                  업로드·조회 흐름·구조 안정성·기준·보조 기준선 (TubeWatch 엔진 분석)
                </p>
              </div>
              {recentVideos.length === 0 && !metrics ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  최근 데이터 부족: 일부 지표는 수치 대신 안내만 표시됩니다.
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {hubCards.map((vm) => (
                  <HubMetricCard key={vm.id} vm={vm} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">최근 영상 표본</h2>
                <p className="mt-1 text-muted-foreground">
                  DNA·Trend 해석에 쓰일 분석 샘플 집합입니다. (스냅샷·엔진 분석)
                </p>
              </div>
              <Card className="bg-card">
                <CardContent className="pt-6">
                  {recentVideos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">최근 데이터 부족 · 표본 없음</p>
                  ) : (
                    <ul className="space-y-4">
                      {recentVideos.slice(0, 8).map((v, i) => {
                        const badge = performanceBadgeShort(v.relativeBadge);
                        const tags = deriveVideoPatternTags(v);
                        return (
                          <li
                            key={i}
                            className="flex flex-col gap-3 border-b border-border/70 pb-4 last:border-0 sm:flex-row sm:items-start"
                          >
                            <div className="flex shrink-0 gap-3">
                              {v.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={v.thumbnailUrl}
                                  alt=""
                                  className="h-16 w-28 rounded-md border border-border object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-28 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                                  썸네일 없음
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <p className="font-medium leading-snug">{v.title}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatPublishedAt(v.publishedAt)}</span>
                                <span>·</span>
                                <span className="tabular-nums">
                                  {v.viewCount != null ? v.viewCount.toLocaleString("ko-KR") : "—"} 조회
                                </span>
                                <span>·</span>
                                <span>{v.durationLabel ?? "길이 없음"}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="text-[10px]">
                                  성과: {badge}
                                </Badge>
                                {tags.map((t) => (
                                  <Badge key={t} variant="outline" className="text-[10px] font-normal">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">상위·하위 성과 비교</h2>
                <p className="mt-1 text-muted-foreground">
                  조회수 기준 상위 20%·하위 20% 표본. 개별 감상이 아니라 반복 차이를 봅니다.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">상위 영상 (Top 20%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {topVideos.length === 0 ? (
                      <p className="text-muted-foreground">최근 데이터 부족</p>
                    ) : (
                      topVideos.slice(0, 4).map((v, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                        >
                          <span className="min-w-0 truncate">{v.title}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {v.viewCount != null ? v.viewCount.toLocaleString("ko-KR") : "—"}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">하위 영상 (Bottom 20%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {weakVideos.length === 0 ? (
                      <p className="text-muted-foreground">최근 데이터 부족</p>
                    ) : (
                      weakVideos.slice(0, 4).map((v, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                        >
                          <span className="min-w-0 truncate">{v.title}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {v.viewCount != null ? v.viewCount.toLocaleString("ko-KR") : "—"}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed bg-muted/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">차이 포인트</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {performanceCompareSummary ?? "메타·길이·주제 차이는 상·하위 표본 메타 비교 및 엔진 분석으로 요약됩니다."}
                  </CardContent>
                </Card>
                <Card className="border-dashed bg-muted/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">반복 차이 패턴</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ListBlock
                      items={normalizeItems(aiInsightFields.content_patterns).slice(0, 5)}
                      emptyText="반복 패턴을 도출하기에 표본·메타가 부족합니다."
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="border-t bg-muted/10 py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">종합 해석</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  이후 메뉴로 넘어가기 전 입력 요약입니다. (TubeWatch 엔진 분석)
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">강점</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ListBlock
                      items={normalizeItems(aiInsightFields.strengths).slice(0, 5)}
                      emptyText="강점 신호를 축약할 데이터가 부족합니다."
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">개선 포인트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ListBlock
                      items={normalizeItems(aiInsightFields.weaknesses).slice(0, 5)}
                      emptyText="개선 포인트를 축약할 데이터가 부족합니다."
                    />
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">근거 요약</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiInsightFields.channel_summary ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {(aiInsightFields.channel_summary ?? "").slice(0, 520)}
                        {(aiInsightFields.channel_summary ?? "").length > 520 ? "…" : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">근거 요약을 생성하지 못했습니다.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">핵심 병목</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ListBlock
                      items={normalizeItems(aiInsightFields.bottlenecks).slice(0, 5)}
                      emptyText="병목을 단정하기에 데이터가 부족합니다."
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">다음 단계 연결</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>원천 진단을 바탕으로 세부 전략 메뉴에서 확장합니다.</p>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/channel-dna" className="font-medium text-foreground underline-offset-4 hover:underline">
                          Channel DNA
                        </Link>{" "}
                        — 패턴·정체성 심화
                      </li>
                      <li>
                        <Link href="/action-plan" className="font-medium text-foreground underline-offset-4 hover:underline">
                          Action Plan
                        </Link>{" "}
                        — 실행·KPI
                      </li>
                      <li>
                        <Link href="/next-trend" className="font-medium text-foreground underline-offset-4 hover:underline">
                          Next Trend
                        </Link>{" "}
                        — 트렌드 후보
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/action-plan">
                    액션 플랜으로 이동
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      {analysisHistory.length > 0 ? (
        <>
          <AppendixSection title="분석 이력" subtitle="이 채널의 과거 분석 기록입니다.">
            <AnalysisHistoryList items={analysisHistory} currentResultId={aiInsightFields.id} />
          </AppendixSection>
        </>
      ) : null}
    </>
  );

  return (
    <AnalysisShell
      channels={channels}
      selectedChannelId={selectedChannel.id}
      gauge={gaugeNode}
      heroRight={heroRightNode}
    >
      {mainRest}
    </AnalysisShell>
  );
}
