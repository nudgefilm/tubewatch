import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalysisShell from "@/components/analysis/AnalysisShell";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import EmptyState from "@/components/ui/EmptyState";

type UserChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analysis_requested_at?: string | null;
  last_analyzed_at?: string | null;
};

const chartIcon = (
  <svg
    className="h-8 w-8"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  </svg>
);

export default async function AnalysisPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: channels } = await supabase
    .from("user_channels")
    .select(
      "id, channel_title, thumbnail_url, subscriber_count, created_at, last_analysis_requested_at, last_analyzed_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!channels || channels.length === 0) {
    return (
      <AppShell
        title="채널 진단"
        description="채널 데이터 기반 성장 분석"
      >
        <PageContainer>
          <div className="flex min-h-[50vh] items-center justify-center">
            <EmptyState
              variant="app"
              title="채널 분석을 시작해 보세요"
              message="TubeWatch는 채널 데이터를 기반으로 성장 신호를 분석합니다. 먼저 분석하고 싶은 YouTube 채널을 등록해 주세요."
              icon={chartIcon}
              action={
                <Link
                  href="/channels"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  채널 등록하기
                </Link>
              }
            />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="채널 진단"
      description="등록된 채널을 선택해 분석 리포트를 확인하세요."
    >
      <AnalysisShell
        channels={channels as UserChannel[]}
        selectedChannelId={null}
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="mx-auto max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {chartIcon}
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              채널을 선택하세요
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              왼쪽 사이드바에서 분석할 채널을 선택하면
              <br />
              상세 리포트를 확인할 수 있습니다.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              총 {channels.length}개 채널 등록됨
            </p>
          </div>
        </div>
      </AnalysisShell>
    </AppShell>
  );
}
