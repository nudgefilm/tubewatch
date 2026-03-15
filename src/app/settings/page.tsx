import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get user's channel count
  const { data: channels } = await supabase
    .from("user_channels")
    .select("id")
    .eq("user_id", user.id);

  const channelCount = channels?.length ?? 0;

  return (
    <AppShell
      title="설정"
      description="서비스 이용 환경과 기본 옵션을 관리할 수 있습니다."
    >
      <PageContainer>
        {/* Channel Settings */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">채널 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">등록된 채널 수</span>
              <span className="text-sm font-medium text-slate-900">{channelCount} / 3개</span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                채널 등록 및 관리는{" "}
                <Link href="/channels" className="font-medium text-slate-900 underline">
                  내 채널
                </Link>{" "}
                페이지에서 가능합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Analysis Settings */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">분석 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">분석 요청 제한</span>
              <span className="text-sm font-medium text-slate-900">10회 / 월</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">분석 주기</span>
              <span className="text-sm font-medium text-slate-900">최소 24시간 간격</span>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                분석 요청 제한은 요금제에 따라 다를 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Display Settings */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">화면 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">언어</span>
              <span className="text-sm font-medium text-slate-900">한국어</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">테마 모드</span>
              <span className="text-sm font-medium text-slate-900">라이트</span>
            </div>
          </div>
        </section>

        {/* Support Link */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">도움말 바로가기</h2>
          <p className="mb-4 text-sm text-slate-600">
            서비스 이용에 도움이 필요하시면 고객 지원 페이지를 방문하세요.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            고객 지원 페이지로 이동
          </Link>
        </section>
      </PageContainer>
    </AppShell>
  );
}
