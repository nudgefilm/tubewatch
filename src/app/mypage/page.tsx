import { redirect } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { createClient } from "@/lib/supabase/server";

export default async function MyPage(): Promise<JSX.Element> {
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

  // Get analysis count
  const { data: analyses } = await supabase
    .from("analysis_results")
    .select("id")
    .eq("user_id", user.id);

  const analysisCount = analyses?.length ?? 0;

  // Format join date
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <AppShell
      title="마이페이지"
      description="계정 정보와 서비스 사용 현황을 확인할 수 있습니다."
    >
      <PageContainer>
        {/* Account Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">계정 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">이메일</span>
              <span className="text-sm font-medium text-slate-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">가입일</span>
              <span className="text-sm font-medium text-slate-900">{joinDate}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">현재 요금제</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                Free
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">등록된 채널 수</span>
              <span className="text-sm font-medium text-slate-900">{channelCount}개</span>
            </div>
          </div>
        </section>

        {/* Usage Summary */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">사용 현황</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">등록된 채널 수</span>
              <span className="text-sm font-medium text-slate-900">{channelCount} / 3개</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">총 분석 실행 횟수</span>
              <span className="text-sm font-medium text-slate-900">{analysisCount}회</span>
            </div>
          </div>
        </section>

        {/* Account Security */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">계정 보안</h2>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Google 계정 로그인</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              연결됨
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            TubeWatch는 Google 계정을 통해 안전하게 로그인합니다.
          </p>
        </section>
      </PageContainer>
    </AppShell>
  );
}
