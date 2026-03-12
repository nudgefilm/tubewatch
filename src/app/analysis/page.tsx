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
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 text-3xl">
            📊
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            채널 분석을 시작해 보세요
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            TubeWatch는 채널 데이터를 기반으로 성장 신호를 분석합니다.
            <br />
            먼저 분석하고 싶은 YouTube 채널을 등록해 주세요.
          </p>
          <Link
            href="/channels"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            채널 등록하기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AnalysisShell channels={channels as UserChannel[]} selectedChannelId={null}>
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
            📊
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            채널을 선택하세요
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            왼쪽 사이드바에서 분석할 채널을 선택하면
            <br />
            상세 리포트를 확인할 수 있습니다.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            총 {channels.length}개 채널 등록됨
          </p>
        </div>
      </div>
    </AnalysisShell>
  );
}
