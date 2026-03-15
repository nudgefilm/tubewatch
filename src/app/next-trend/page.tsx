import { redirect } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/ui/EmptyState";

export default async function NextTrendPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const emptyStateIcon = (
    <svg
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );

  return (
    <AppShell
      title="Next Trend"
      description="데이터 기반 시그널로 다음 영상 아이디어를 발견하세요."
    >
      <PageContainer>
        <EmptyState
          variant="app"
          title="Next Trend 기능 준비 중"
          message="트렌드 분석 기능이 곧 출시됩니다. 채널 분석을 먼저 진행해 보세요."
          icon={emptyStateIcon}
          href="/channels"
          linkText="채널 분석하러 가기"
        />
      </PageContainer>
    </AppShell>
  );
}
