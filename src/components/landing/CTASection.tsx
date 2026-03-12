import Link from "next/link";
import GoogleLoginButton from "@/components/landing/GoogleLoginButton";

type CTASectionProps = {
  isAuthenticated?: boolean;
};

export default function CTASection({ isAuthenticated = false }: CTASectionProps): JSX.Element {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white px-8 py-14 text-center shadow-sm sm:px-14 sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            지금 채널을 분석해 보세요
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-500">
            채널을 등록하면 데이터 수집부터 전략 리포트까지 자동으로 진행됩니다.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Link
                href="/channels"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-indigo-700"
              >
                대시보드로 이동
              </Link>
            ) : (
              <>
                <GoogleLoginButton
                  className="inline-flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                  label="Google로 시작하기"
                />
                <Link
                  href="/channels"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-indigo-700"
                >
                  채널 분석 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
