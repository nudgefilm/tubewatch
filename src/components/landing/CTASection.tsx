import Link from "next/link";
import GoogleLoginButton from "@/components/landing/GoogleLoginButton";

type CTASectionProps = {
  isAuthenticated?: boolean;
};

export default function CTASection({ isAuthenticated = false }: CTASectionProps): JSX.Element {
  return (
    <section className="border-t border-white/[0.04] bg-[#0b0c11] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-14 text-center sm:px-14 sm:py-20">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.08] blur-[80px]" />

          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              지금 채널을 분석해 보세요
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-400">
              채널을 등록하면 데이터 수집부터 전략 리포트까지 자동으로 진행됩니다.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Link
                  href="/channels"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-[15px] font-semibold text-gray-900 transition hover:bg-gray-100"
                >
                  대시보드로 이동
                  <span aria-hidden="true" className="text-gray-400">→</span>
                </Link>
              ) : (
                <>
                  <GoogleLoginButton
                    className="inline-flex items-center gap-2.5 rounded-lg bg-white px-7 py-3.5 text-[15px] font-semibold text-gray-900 shadow-lg shadow-white/5 transition hover:bg-gray-100 disabled:opacity-50"
                    label="Google로 시작하기"
                  />
                  <Link
                    href="/channels"
                    className="inline-flex items-center rounded-lg px-5 py-3 text-[15px] font-medium text-gray-500 transition hover:text-gray-300"
                  >
                    먼저 둘러보기
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
