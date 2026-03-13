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
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

export default async function SeoLabPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      title="SEO 랩"
      description="영상·채널 검색 노출을 위한 키워드·태그 인사이트."
    >
      <PageContainer>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState
            variant="app"
            title="SEO 인사이트를 보려면 채널 진단을 먼저 진행하세요"
            message="채널 진단이 완료되면 여기에 키워드·태그 관련 인사이트가 표시됩니다."
            icon={placeholderIcon}
          />
        </section>
      </PageContainer>
    </AppShell>
  );
}
