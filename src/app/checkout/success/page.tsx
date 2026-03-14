import Link from "next/link";
import { Navigation } from "@/v0-import/components/landing/navigation";
import { FooterSection } from "@/v0-import/components/landing/footer-section";
import { GuestUpsellCard } from "@/components/billing/GuestUpsellCard";
import { supabaseAdmin } from "@/lib/supabase/admin";

type GuestReportRow = {
  id: string;
  pdf_url: string | null;
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const sessionId = params?.session_id?.trim() ?? null;

  let report: GuestReportRow | null = null;
  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("guest_reports")
      .select("id, pdf_url")
      .eq("stripe_session_id", sessionId)
      .maybeSingle<GuestReportRow>();
    report = data ?? null;
  }

  const canDownload = report?.pdf_url != null && report.pdf_url.length > 0;
  const reportId = report?.id ?? null;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            결제가 완료되었습니다.
          </h1>
          <p className="mt-4 text-gray-600">
            {canDownload
              ? "전략 리포트가 준비되었습니다. 아래에서 다운로드하세요."
              : "리포트 생성 기능은 다음 단계에서 연결됩니다."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            {canDownload && reportId ? (
              <a
                href={`/api/guest-report/download/${reportId}`}
                className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                download
              >
                전략 리포트 다운로드
              </a>
            ) : null}
            <Link
              href="/"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              홈으로 이동
            </Link>
            <Link
              href="/guest-report"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Guest Report로 돌아가기
            </Link>
          </div>
          <GuestUpsellCard />
        </div>
      </main>
      <FooterSection />
    </>
  );
}
