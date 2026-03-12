import Link from "next/link";
import GoogleLoginButton from "@/components/landing/GoogleLoginButton";

type HeroProps = {
  isAuthenticated?: boolean;
};

export default function Hero({ isAuthenticated = false }: HeroProps): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-[#08090d]">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Spotlight glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-500/[0.07] blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-6 pb-28 pt-36 sm:pb-36 sm:pt-44">
        <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.2em] text-indigo-400">
          YouTube Channel Growth Analysis
        </p>

        <h1 className="max-w-3xl text-[2.5rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
          데이터로 설계하는
          <br />
          유튜브 성장 전략
        </h1>

        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-gray-400">
          채널 데이터를 기반으로 성장 병목과 콘텐츠 방향을 분석합니다.
          <br className="hidden sm:block" />
          감이 아닌 데이터로 다음 전략을 설계하세요.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/channels"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              대시보드로 이동
              <span aria-hidden="true" className="text-gray-400">→</span>
            </Link>
          ) : (
            <GoogleLoginButton
              className="inline-flex items-center gap-2.5 rounded-lg bg-white px-6 py-3 text-[15px] font-semibold text-gray-900 shadow-lg shadow-white/5 transition hover:bg-gray-100 disabled:opacity-50"
              label="Google로 시작하기"
            />
          )}
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-lg px-5 py-3 text-[15px] font-medium text-gray-500 transition hover:text-gray-300"
          >
            분석 과정 보기
          </a>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3">
          {[
            { value: "20", label: "영상 표본 분석" },
            { value: "30+", label: "채널 지표 계산" },
            { value: "7", label: "패턴 감지 유형" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#08090d] px-6 py-5">
              <p className="text-2xl font-semibold tabular-nums text-white">{stat.value}</p>
              <p className="mt-1 text-[13px] text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
