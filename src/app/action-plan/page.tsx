import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import EmptyState from "@/components/ui/EmptyState";

const placeholderIcon = (
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
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108v8.586c0 1.135.845 2.098 1.976 2.192a48.424 48.424 0 001.124-.08"
    />
  </svg>
);

export default async function ActionPlanPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      title="액션 플랜"
      description="분석 결과를 바탕으로 추천된 다음 액션을 확인하세요."
    >
      <PageContainer>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState
            variant="app"
            title="액션 플랜을 생성하려면 채널 진단을 먼저 진행하세요"
            message="채널 진단에서 분석을 완료하면 여기에 맞춤 액션 플랜이 표시됩니다."
            icon={placeholderIcon}
          />
        </section>
      </PageContainer>
    </AppShell>
  );
}
