import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import AnalysisShell from "@/components/analysis/AnalysisShell";

type UserChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analysis_requested_at?: string | null;
  last_analyzed_at?: string | null;
};

function formatNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AnalysisPage() {
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
          <Link
            href="/channels"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            채널 등록하기
          </Link>
        </div>
      </main>
    );
  }

  const latestAnalyzedChannel =
    channels.find((channel) => !!channel.last_analyzed_at) ?? null;

  const primaryChannel = latestAnalyzedChannel ?? channels[0];

  return (
    <AnalysisShell channels={channels as UserChannel[]} selectedChannelId={null}>
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Analysis Hub</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            채널을 선택해 분석 리포트를 확인하세요
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            왼쪽 채널 목록에서 원하는 채널을 선택하면 상세 분석 리포트
            페이지로 이동합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/analysis/${primaryChannel.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {primaryChannel.channel_title ?? "기본 채널"} 리포트 보기
            </Link>

            <Link
              href="/channels"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              채널 관리로 이동
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              추천 진입 채널
            </h2>

            <div className="mt-4 flex items-center gap-4">
              {primaryChannel.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryChannel.thumbnail_url}
                  alt={primaryChannel.channel_title ?? "channel"}
                  className="h-14 w-14 rounded-full"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                  {(primaryChannel.channel_title ?? "C")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-gray-900">
                  {primaryChannel.channel_title ?? "채널명 없음"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  구독자 {formatNumber(primaryChannel.subscriber_count)}명
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  최근 분석 시각: {formatDateTime(primaryChannel.last_analyzed_at)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={`/analysis/${primaryChannel.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                상세 리포트 열기
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">이 페이지의 역할</h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              <li className="rounded-xl bg-gray-50 px-4 py-3">
                등록된 채널 목록을 빠르게 탐색
              </li>
              <li className="rounded-xl bg-gray-50 px-4 py-3">
                채널별 상세 분석 리포트 페이지로 이동
              </li>
              <li className="rounded-xl bg-gray-50 px-4 py-3">
                향후 액션 플랜, SEO 랩, 벤치마킹 메뉴와 연결되는 분석 허브
              </li>
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                등록된 채널
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                채널을 클릭하면 해당 상세 분석 페이지로 이동합니다.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              총 {channels.length}개 채널
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/analysis/${channel.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {channel.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={channel.thumbnail_url}
                      alt={channel.channel_title ?? "channel"}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                      {(channel.channel_title ?? "C").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {channel.channel_title ?? "채널명 없음"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      구독자 {formatNumber(channel.subscriber_count)}명
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <p>최근 분석 요청: {formatDateTime(channel.last_analysis_requested_at)}</p>
                  <p>최근 분석 완료: {formatDateTime(channel.last_analyzed_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AnalysisShell>
  );
}