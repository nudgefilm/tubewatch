import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import AnalysisShell from "@/components/analysis/AnalysisShell";
import AnalysisReportView from "@/components/analysis/AnalysisReportView";
import { isAdminUser } from "@/lib/admin/adminTools";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";

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

function countNonEmpty(items: string[] | null | undefined): number {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => typeof item === "string" && item.trim().length > 0)
    .length;
}

function hasUsableAnalysis(result: AnalysisResult | null | undefined): boolean {
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
      <AppShell title="채널 진단" description="채널 데이터 기반 성장 분석">
        <PageContainer>
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            채널 정보를 불러오지 못했습니다.
          </section>
        </PageContainer>
      </AppShell>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <AppShell title="채널 진단" description="채널 데이터 기반 성장 분석">
        <PageContainer>
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="mx-auto max-w-md text-center">
              <p className="text-base text-slate-600">
                채널을 먼저 등록해 주세요.
              </p>
              <a
                href="/channels"
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                채널 등록하기
              </a>
            </div>
          </div>
        </PageContainer>
      </AppShell>
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
      <AppShell
        title="채널 진단"
        description={selectedChannel.channel_title ?? "분석 리포트"}
      >
        <AnalysisShell
          channels={channels as UserChannel[]}
          selectedChannelId={selectedChannel.id}
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            분석 결과를 불러오는 중 오류가 발생했습니다.
          </section>
        </AnalysisShell>
      </AppShell>
    );
  }

  const successfulRows = Array.isArray(successfulResults)
    ? (successfulResults as AnalysisResult[])
    : [];

  const usableSuccessfulRows = successfulRows.filter((row) => hasUsableAnalysis(row));
  const latestUsableSuccessfulResult = usableSuccessfulRows[0] ?? null;
  const previousUsableSuccessfulResult = usableSuccessfulRows[1] ?? null;

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
      <AppShell
        title="채널 진단"
        description={selectedChannel.channel_title ?? "분석 리포트"}
      >
        <AnalysisShell
          channels={channels as UserChannel[]}
          selectedChannelId={selectedChannel.id}
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            분석 결과를 불러오는 중 오류가 발생했습니다.
          </section>
        </AnalysisShell>
      </AppShell>
    );
  }

  const latestAnyResult =
    Array.isArray(latestResults) && latestResults.length > 0
      ? (latestResults[0] as AnalysisResult)
      : null;

  const latestResult =
    latestUsableSuccessfulResult ?? latestAnyResult ?? null;

  const { data: historyRows } = await supabase
    .from("analysis_results")
    .select("id, job_id, created_at, feature_total_score, status, gemini_status")
    .eq("user_channel_id", selectedChannel.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const analysisHistory = Array.isArray(historyRows) ? historyRows : [];

  return (
    <AppShell
      title="채널 진단"
      description={selectedChannel.channel_title ?? "분석 리포트"}
    >
      <AnalysisShell
        channels={channels as UserChannel[]}
        selectedChannelId={selectedChannel.id}
      >
        <AnalysisReportView
          selectedChannel={selectedChannel}
          latestResult={latestResult}
          previousResult={previousUsableSuccessfulResult}
          isAdmin={isAdminUser(user.email)}
          analysisHistory={analysisHistory}
        />
      </AnalysisShell>
    </AppShell>
  );
}
