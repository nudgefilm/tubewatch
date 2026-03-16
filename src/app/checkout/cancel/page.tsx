import Link from "next/link";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";

export default function CheckoutCancelPage(): JSX.Element {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            결제가 취소되었습니다.
          </h1>
          <p className="mt-4 text-gray-600">
            다시 구매를 진행할 수 있습니다.
          </p>
          <div className="mt-8">
            <Link
              href="/guest-report"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Guest Report로 돌아가기
            </Link>
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
