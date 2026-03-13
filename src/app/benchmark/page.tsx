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
      d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
    />
  </svg>
);

export default async function BenchmarkPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      title="벤치마킹"
      description="비슷한 채널과의 지표 비교."
    >
      <PageContainer>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState
            variant="app"
            title="벤치마킹 데이터를 보려면 채널 진단을 먼저 진행하세요"
            message="채널 진단이 완료되면 여기에 벤치마크 비교 결과가 표시됩니다."
            icon={placeholderIcon}
          />
        </section>
      </PageContainer>
    </AppShell>
  );
}
