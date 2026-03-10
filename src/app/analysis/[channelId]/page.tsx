import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import AnalysisShell from "@/components/analysis/AnalysisShell";
import AnalysisReportView from "@/components/analysis/AnalysisReportView";

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
      <main className="p-10">
        <p>분석 가능한 채널이 없습니다.</p>
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
      <section className="mb-6 rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Analysis Status
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {selectedChannel.channel_title ?? "채널 분석 리포트"}
            </h1>
            <p className="text-sm text-slate-600">
              최근 성공 분석 기준으로 72시간 쿨다운 상태를 표시합니다.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${cooldown.statusTone}`}
          >
            {cooldown.statusLabel}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">마지막 성공 분석 시각</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {cooldown.lastActionAtText}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">다음 분석 가능 시각</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {cooldown.nextAvailableAtText}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">남은 시간</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {cooldown.remainingText}
            </p>
          </div>
        </div>
      </section>

      <AnalysisReportView
        selectedChannel={selectedChannel}
        latestResult={latestResult}
      />
    </AnalysisShell>
  );
}