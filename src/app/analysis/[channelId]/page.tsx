import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import AnalysisShell from "@/components/analysis/AnalysisShell";
import AnalysisReportView from "@/components/analysis/AnalysisReportView";
import {
  StatusBadge,
  toStatusBadgeStatus,
} from "@/components/ui/StatusBadge";
import { isAdminUser } from "@/lib/admin/adminTools";

type UserChannel = {
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
  gemini_error?: string | null;

  feature_snapshot: Record<string, unknown> | null;
  feature_total_score: number | null;
  feature_section_scores: Record<string, number> | null;

  created_at: string | null;
};

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

function countNonEmpty(items: string[] | null | undefined) {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => typeof item === "string" && item.trim().length > 0)
    .length;
}

function hasUsableAnalysis(result: AnalysisResult | null | undefined) {
  if (!result) return false;
  if (!(result.status === "analyzed" && result.gemini_status === "success")) {
    return false;
  }

  const channelSummaryOk =
    typeof result.channel_summary === "string" &&
    result.channel_summary.trim().length > 0;

  const populatedSections =
    countNonEmpty(result.content_patterns) +
    countNonEmpty(result.strengths) +
    countNonEmpty(result.weaknesses) +
    countNonEmpty(result.bottlenecks) +
    countNonEmpty(result.recommended_topics) +
    countNonEmpty(result.growth_action_plan) +
    countNonEmpty(result.target_audience);

  return channelSummaryOk && populatedSections >= 3;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "지금 분석 가능";

  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}분`);

  return `${parts.join(" ")} 남음`;
}

function buildCooldownState(
  channel: UserChannel,
  latestResult: AnalysisResult | null
) {
  const successBase =
    channel.last_analyzed_at ??
    (latestResult?.status === "analyzed" &&
    latestResult?.gemini_status === "success"
      ? latestResult.gemini_analyzed_at ?? latestResult.created_at
      : null);

  if (!successBase) {
    return {
      isCooldownActive: false,
      statusLabel: "지금 분석 가능",
      statusTone:
        "border-emerald-200 bg-emerald-50 text-emerald-700" as const,
      lastActionAtText: "-",
      nextAvailableAtText: "지금",
      remainingText: "지금 분석 가능",
    };
  }

  const lastActionAt = new Date(successBase);

  if (Number.isNaN(lastActionAt.getTime())) {
    return {
      isCooldownActive: false,
      statusLabel: "지금 분석 가능",
      statusTone:
        "border-emerald-200 bg-emerald-50 text-emerald-700" as const,
      lastActionAtText: "-",
      nextAvailableAtText: "지금",
      remainingText: "지금 분석 가능",
    };
  }

  const nextAvailableAt = new Date(lastActionAt.getTime() + COOLDOWN_MS);
  const now = new Date();
  const remainingMs = nextAvailableAt.getTime() - now.getTime();
  const isCooldownActive = remainingMs > 0;

  return {
    isCooldownActive,
    statusLabel: isCooldownActive ? "72시간 쿨다운 진행 중" : "지금 분석 가능",
    statusTone: isCooldownActive
      ? ("border-amber-200 bg-amber-50 text-amber-700" as const)
      : ("border-emerald-200 bg-emerald-50 text-emerald-700" as const),
    lastActionAtText: formatDateTime(lastActionAt.toISOString()),
    nextAvailableAtText: formatDateTime(nextAvailableAt.toISOString()),
    remainingText: isCooldownActive ? formatRemaining(remainingMs) : "지금 분석 가능",
  };
}

export default async function AnalysisChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: channels, error: channelsError } = await supabase
    .from("user_channels")
    .select(
      "id, channel_title, thumbnail_url, subscriber_count, created_at, last_analysis_requested_at, last_analyzed_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (channelsError) {
    console.error("[analysis/[channelId]] channels query error:", channelsError);

    return (
      <main className="p-10">
        <p>채널 정보를 불러오지 못했습니다.</p>
      </main>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            📊
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            채널 분석을 시작해 보세요
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            TubeWatch는 채널 데이터를 기반으로 성장 신호를 분석합니다.
            <br />
            먼저 분석하고 싶은 YouTube 채널을 등록해 주세요.
          </p>
          <a
            href="/channels"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            채널 등록하기
          </a>
        </div>
      </main>
    );
  }

  const selectedChannel = channels.find((c) => c.id === params.channelId);

  if (!selectedChannel) {
    redirect("/analysis");
  }

  const { data: successfulResults, error: successfulResultsError } =
    await supabase
      .from("analysis_results")
      .select("*")
      .eq("user_channel_id", selectedChannel.id)
      .eq("status", "analyzed")
      .eq("gemini_status", "success")
      .order("created_at", { ascending: false })
      .limit(20);

  if (successfulResultsError) {
    console.error(
      "[analysis/[channelId]] successful results query error:",
      successfulResultsError
    );

    return (
      <AnalysisShell
        channels={channels as UserChannel[]}
        selectedChannelId={selectedChannel.id}
      >
        <section className="rounded-2xl border bg-white p-6 text-sm text-red-600">
          분석 결과를 불러오는 중 오류가 발생했습니다.
        </section>
      </AnalysisShell>
    );
  }

  const successfulRows = Array.isArray(successfulResults)
    ? (successfulResults as AnalysisResult[])
    : [];

  const latestUsableSuccessfulResult =
    successfulRows.find((row) => hasUsableAnalysis(row)) ?? null;

  const { data: latestResults, error: latestResultsError } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("user_channel_id", selectedChannel.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestResultsError) {
    console.error(
      "[analysis/[channelId]] latest results query error:",
      latestResultsError
    );

    return (
      <AnalysisShell
        channels={channels as UserChannel[]}
        selectedChannelId={selectedChannel.id}
      >
        <section className="rounded-2xl border bg-white p-6 text-sm text-red-600">
          분석 결과를 불러오는 중 오류가 발생했습니다.
        </section>
      </AnalysisShell>
    );
  }

  const latestAnyResult =
    Array.isArray(latestResults) && latestResults.length > 0
      ? (latestResults[0] as AnalysisResult)
      : null;

  const latestResult =
    latestUsableSuccessfulResult ?? latestAnyResult ?? null;

  const cooldown = buildCooldownState(selectedChannel as UserChannel, latestResult);

  return (
    <AnalysisShell
      channels={channels as UserChannel[]}
      selectedChannelId={selectedChannel.id}
    >
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Analysis Status
            </p>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {selectedChannel.channel_title ?? "채널 분석 리포트"}
            </h1>
            <p className="text-sm text-gray-500">
              최근 성공 분석 기준으로 72시간 쿨다운 상태를 표시합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={toStatusBadgeStatus(
                latestResult?.status,
                latestResult?.gemini_status
              )}
            />
            <span
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${cooldown.statusTone}`}
            >
              {cooldown.statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">마지막 성공 분석 시각</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {cooldown.lastActionAtText}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">다음 분석 가능 시각</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {cooldown.nextAvailableAtText}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">남은 시간</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {cooldown.remainingText}
            </p>
          </div>
        </div>
      </section>

      <AnalysisReportView
        selectedChannel={selectedChannel}
        latestResult={latestResult}
        isAdmin={isAdminUser(user.email)}
      />
    </AnalysisShell>
  );
}