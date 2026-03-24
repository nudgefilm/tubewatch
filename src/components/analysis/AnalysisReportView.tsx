"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ElementType,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
  Search,
  Target,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  StatusBadge,
  toStatusBadgeStatus,
} from "@/components/ui/StatusBadge";
import ChannelDnaRadar from "@/components/analysis/ChannelDnaRadar";
import NextTrend from "@/components/analysis/NextTrend";
import FirstAnalysisGuide from "@/components/analysis/FirstAnalysisGuide";
import { AnalysisReportSkeleton } from "@/components/ui/SkeletonCard";
import type { ChannelSizeTier, ConfidenceLevel } from "@/lib/analysis/engine/types";
import { formatDateTime } from "@/lib/format/formatDateTime";
import AnalysisHistoryList from "@/components/analysis/AnalysisHistoryList";
import type { AnalysisHistoryItem } from "@/components/analysis/AnalysisHistoryList";
import GrowthTrendChart from "@/components/analysis/GrowthTrendChart";
import AnalysisCompareCard from "@/components/analysis/AnalysisCompareCard";
import type { AnalysisViewModel } from "@/lib/analysis/analysisViewModel";
import type { AnalysisCardVM } from "@/lib/analysis/analysisViewModel";
import type {
  AnalysisReportAiFieldsVm,
  AnalysisReportCompareVm,
  AnalysisReportPresentationVm,
} from "@/lib/analysis/analysisReportFields";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import type { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";
import AnalysisShell from "@/components/analysis/AnalysisShell";

// ── Types (props 계약 유지) ──

type SelectedChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
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
        <span className="mt-1 text-sm text-muted-foreground">Channel Score</span>
      </div>
    </div>
  );
}

function DiagnosisCard({
  title,
  score,
  icon: Icon,
  status,
  items,
}: {
  title: string;
  score: number;
  icon: ElementType;
  status: "good" | "warning" | "critical";
  items: { label: string; value: string; trend?: "up" | "down" }[];
}) {
  const statusColors = {
    good: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <Card className="bg-card transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${statusColors[status]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                진단 점수: {score}/100
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            {status === "good" ? "양호" : status === "warning" ? "주의" : "개선필요"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress value={score} className="mb-4 h-1.5" />
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{item.value}</span>
                {item.trend ? (
                  item.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral";
}) {
  const typeStyles = {
    positive: "border-l-green-500 bg-green-500/5",
    negative: "border-l-red-500 bg-red-500/5",
    neutral: "border-l-blue-500 bg-blue-500/5",
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 border-l-4 ${typeStyles[type]}`}>
      <div className="flex items-start gap-3">
        {type === "positive" ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
        ) : type === "negative" ? (
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
        ) : (
          <Target className="mt-0.5 h-5 w-5 text-blue-500" />
        )}
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ── Constants ──

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

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

const DIAGNOSIS_ORDER: {
  key: string;
  title: string;
  icon: ElementType;
  cardId: string;
}[] = [
  { key: "channelActivity", title: "활동 지표", icon: Video, cardId: "upload_frequency" },
  { key: "audienceResponse", title: "반응 지표", icon: ThumbsUp, cardId: "engagement" },
  { key: "contentStructure", title: "구조 분석", icon: BarChart3, cardId: "video_length" },
  { key: "seoOptimization", title: "SEO 점수", icon: Search, cardId: "content_meta" },
  { key: "growthMomentum", title: "성장 지표", icon: TrendingUp, cardId: "view_performance" },
];

// ── Formatters ──

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getChannelSizeTier(subscriberCount: number | null | undefined): ChannelSizeTier {
  const count = subscriberCount ?? 0;
  if (count >= 100_000) return "large";
  if (count >= 10_000) return "medium";
  if (count >= 1_000) return "small";
  return "micro";
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

function sectionStatusFromScore(score: number): "good" | "warning" | "critical" {
  if (score >= 70) return "good";
  if (score >= 50) return "warning";
  return "critical";
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

function findCard(vm: AnalysisViewModel | null, id: string): AnalysisCardVM | undefined {
  return vm?.cards.find((c) => c.id === id);
}

function buildDiagnosisItems(
  score: number,
  card: AnalysisCardVM | undefined
): { label: string; value: string; trend?: "up" | "down" }[] {
  const trend: "up" | "down" | undefined =
    score >= 70 ? "up" : score < 50 ? "down" : undefined;
  return [
    { label: "핵심 지표", value: card ? String(card.value) : "—", trend },
    {
      label: "데이터",
      value: card ? `${card.dataStatus}` : "—",
    },
    {
      label: "신뢰도",
      value: card ? `${card.confidence}` : "—",
    },
  ];
}

// ── Appendix blocks (기능 유지, v0 섹션 래퍼와 동일 패딩) ──

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

function AiSection({
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
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          {icon ? <span>{icon}</span> : null}
          {title}
        </h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
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

  const insightRows = useMemo(() => {
    if (!aiInsightFields) {
      return [] as {
        title: string;
        description: string;
        type: "positive" | "negative" | "neutral";
      }[];
    }
    const rows: { title: string; description: string; type: "positive" | "negative" | "neutral" }[] =
      [];
    const s = aiInsightFields.strengths?.[0];
    const w = aiInsightFields.weaknesses?.[0];
    const r = aiInsightFields.recommended_topics?.[0];
    if (s) rows.push({ title: "강점 신호", description: s, type: "positive" });
    if (w) rows.push({ title: "개선 포인트", description: w, type: "negative" });
    if (r) rows.push({ title: "추천 주제", description: r, type: "neutral" });
    while (rows.length < 3) {
      rows.push({
        title: "분석 인사이트",
        description:
          aiInsightFields.channel_summary?.slice(0, 200) ??
          "추가 인사이트는 분석 데이터가 쌓일수록 정교해집니다.",
        type: "neutral",
      });
    }
    return rows.slice(0, 3);
  }, [aiInsightFields]);

  if (!reportPresentation || !aiInsightFields) {
    return (
      <>
        <div className="relative mx-auto h-72 w-72 shrink-0" aria-hidden />
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
          <section className="py-12">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">종합 진단 리포트</h1>
                <p className="mt-2 text-muted-foreground">채널 데이터 기반 상세 분석 결과</p>
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

  const sectionScores = reportPresentation.sectionScores;

  const viewCard = findCard(analysisViewModel, "view_performance");

  const summarySubscribers = formatNumber(selectedChannel.subscriber_count);
  const summaryTotalViews = viewCard ? String(viewCard.value) : "—";
  const summaryVideos = formatNumber(reportPresentation.sampleVideoCount);
  const summaryAvgViews =
    metrics != null
      ? formatNumber(Math.round(metrics.avgViewCount))
      : viewCard
        ? String(viewCard.value)
        : "—";

  function getRequestButtonLabel(): string {
    if (isSubmitting) return "분석 요청 중...";
    if (isRefreshing) return "상태 반영 중...";
    if (localPending) return "분석 요청됨";
    if (isBackendRunning) return "분석 진행 중";
    if (isCooldownBlocked) return "72시간 쿨다운 적용 중";
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">종합 진단 리포트</h1>
        <p className="mt-2 text-muted-foreground">채널 데이터 기반 상세 분석 결과</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">구독자</p>
                <p className="text-xl font-bold">{summarySubscribers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 조회수</p>
                <p className="text-xl font-bold">{summaryTotalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Video className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">영상 수</p>
                <p className="text-xl font-bold">{summaryVideos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">평균 조회수</p>
                <p className="text-xl font-bold">{summaryAvgViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
        <StatusBadge
          status={toStatusBadgeStatus(reportPresentation.status, reportPresentation.geminiStatus)}
        />
        <span
          className={`group relative inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceClassName}`}
        >
          {confidenceLabel}
          {(analysisViewModel?.confidenceReasons?.length ?? 0) > 0 ? (
            <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-xl border border-border bg-card p-3 text-left text-xs font-normal shadow-lg group-hover:block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                신뢰도 근거
              </span>
              {analysisViewModel?.confidenceReasons.map((reason, i) => (
                <span key={i} className="mb-1 block leading-relaxed">
                  {reason}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </div>

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
            <p className="text-muted-foreground">최근 분석: {analyzedAt}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">분석 시각</p>
            <p className="text-lg font-bold">{analyzedAt}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">분석 영상</p>
            <p className="text-lg font-bold">{formatNumber(reportPresentation.sampleVideoCount)}개</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">AI 모델</p>
            <p className="text-lg font-bold">{reportPresentation.geminiModel ?? "-"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">다음 분석</p>
            <p className="text-lg font-bold">
              {cooldown.isCooldownActive ? cooldown.nextAvailableAtText : "가능"}
            </p>
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
                데이터 수집과 AI 분석이 완료되면 아래에 리포트가 표시됩니다. 약 1~2분 후 페이지를 새로고침해 주세요.
              </p>
            </div>
            <AnalysisReportSkeleton />
          </div>
        </section>
      ) : (
        <>
          {sectionScores ? (
            <section className="py-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">영역별 진단</h2>
                    <p className="mt-1 text-muted-foreground">5개 핵심 영역의 상세 분석 결과</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {DIAGNOSIS_ORDER.map((row) => {
                    const sc = sectionScores[row.key as keyof typeof sectionScores];
                    if (typeof sc !== "number") return null;
                    const card = findCard(analysisViewModel, row.cardId);
                    return (
                      <DiagnosisCard
                        key={row.key}
                        title={row.title}
                        score={Math.round(sc)}
                        icon={row.icon}
                        status={sectionStatusFromScore(sc)}
                        items={buildDiagnosisItems(sc, card)}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {metrics ? (
            <section className="py-12">
              <div className="space-y-6">
                <ChannelDnaRadar metrics={metrics} />
              </div>
            </section>
          ) : null}

          <section className="bg-muted/20 py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">패턴 인사이트</h2>
                <p className="mt-1 text-muted-foreground">데이터에서 발견된 주요 패턴과 시사점</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {insightRows.map((row, idx) => (
                  <InsightCard key={idx} title={row.title} description={row.description} type={row.type} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">성장 트렌드</h2>
                <p className="mt-1 text-muted-foreground">최근 90일간 채널 성장 추이</p>
              </div>
              <Card className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/30">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p className="text-sm">성장 트렌드 차트</p>
                      <p className="mt-1 text-xs">데이터 연결 시 활성화</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="border-t bg-muted/10 py-12">
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-2xl font-bold">분석 결과를 바탕으로 다음 단계를 시작하세요</h2>
                <p className="mt-1 text-muted-foreground">
                  진단 결과를 기반으로 맞춤형 액션 플랜을 확인하거나, SEO 최적화를 시작할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/action-plan">
                    액션 플랜 확인하기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/seo-lab">
                    SEO Lab 시작하기
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <AppendixSection title="AI Insights" subtitle="Gemini 분석 엔진이 생성한 인사이트입니다.">
            <div className="space-y-6">
              <AiSection title="채널 요약" icon="📋">
                {aiInsightFields.channel_summary ? (
                  <p className="text-sm leading-7">{aiInsightFields.channel_summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">채널 요약을 생성하지 못했습니다.</p>
                )}
              </AiSection>

              <AiSection
                title="콘텐츠 패턴"
                icon="🔁"
                description={
                  aiInsightFields.content_pattern_summary ?? "반복적으로 보이는 콘텐츠 흐름입니다."
                }
              >
                <ListBlock
                  items={aiInsightFields.content_patterns}
                  emptyText="콘텐츠 패턴을 분석하기에 데이터가 부족합니다."
                />
              </AiSection>

              <div className="grid gap-6 xl:grid-cols-2">
                <AiSection title="강점" icon="💪">
                  <ListBlock
                    items={aiInsightFields.strengths}
                    emptyText="현재 데이터에서 뚜렷한 강점을 도출하지 못했습니다."
                  />
                </AiSection>
                <AiSection title="약점" icon="⚠️">
                  <ListBlock
                    items={aiInsightFields.weaknesses}
                    emptyText="현재 데이터에서 뚜렷한 약점을 도출하지 못했습니다."
                  />
                </AiSection>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <AiSection title="병목 요인" icon="🚧">
                  <ListBlock
                    items={aiInsightFields.bottlenecks}
                    emptyText="뚜렷한 병목 요인이 감지되지 않았습니다."
                  />
                </AiSection>
                <AiSection title="타겟 시청자" icon="🎯">
                  <ListBlock
                    items={aiInsightFields.target_audience}
                    emptyText="타겟 시청자 정보가 충분하지 않습니다."
                  />
                </AiSection>
              </div>

              <AiSection title="추천 콘텐츠" icon="💡">
                <ListBlock
                  items={aiInsightFields.recommended_topics}
                  emptyText="추천 콘텐츠 주제를 생성하지 못했습니다."
                />
              </AiSection>

              <AiSection title="성장 액션 플랜" icon="🚀">
                <ListBlock
                  items={aiInsightFields.growth_action_plan}
                  emptyText="실행 가능한 액션 플랜을 생성하지 못했습니다."
                />
              </AiSection>
            </div>
          </AppendixSection>

          <AppendixSection title="Next Trend" subtitle="채널 데이터를 기반으로 향후 시도해볼 콘텐츠 방향입니다.">
            <NextTrend
              recommendedTopics={aiInsightFields.recommended_topics}
              contentPatterns={aiInsightFields.content_patterns}
              growthActionPlan={aiInsightFields.growth_action_plan}
              targetAudience={aiInsightFields.target_audience}
            />
          </AppendixSection>
        </>
      )}

      {analysisHistory.length > 0 ? (
        <>
          <AppendixSection title="Growth Trend" subtitle="분석 점수의 변화 추이를 확인합니다.">
            <Card className="bg-card">
              <CardContent className="pt-6">
                <GrowthTrendChart points={analysisHistory} />
              </CardContent>
            </Card>
          </AppendixSection>

          <AppendixSection title="Analysis Compare" subtitle="이전 분석 결과와 현재를 비교합니다.">
            {reportCompare ? (
              <AnalysisCompareCard current={reportCompare.current} previous={reportCompare.previous} />
            ) : null}
          </AppendixSection>

          <AppendixSection title="Analysis History" subtitle="이 채널의 과거 분석 기록입니다.">
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
