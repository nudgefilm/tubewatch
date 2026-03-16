import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { GuestReportClient } from "./GuestReportClient";

export default function GuestReportPage(): JSX.Element {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            전략 분석 미리보기
          </h1>
          <p className="mb-8 text-gray-600">
            채널 URL을 입력하면 리포트 일부를 미리 볼 수 있습니다.
          </p>
          <GuestReportClient />
        </div>
      </main>
      <FooterSection />
    </>
  );
}
