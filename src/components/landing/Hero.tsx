import Link from "next/link";

export default function Hero(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-gray-950 to-gray-950" />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pb-32 sm:pt-40">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
          YouTube Channel Growth Analysis
        </p>

        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          데이터로 설계하는
          <br />
          유튜브 성장 전략
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
          채널 데이터를 기반으로 성장 병목과 콘텐츠 방향을 분석합니다.
          <br className="hidden sm:block" />
          감이 아닌 데이터로 다음 전략을 설계하세요.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/channels"
            className="inline-flex items-center rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500"
          >
            내 채널 분석하기
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-xl border border-gray-700 px-7 py-3.5 text-base font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
          >
            분석 과정 보기
          </a>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { value: "20", label: "영상 표본 분석" },
            { value: "30+", label: "채널 지표 계산" },
            { value: "7", label: "패턴 감지 유형" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900/50 px-5 py-4">
              <p className="text-3xl font-bold tabular-nums text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
