import Link from "next/link";

type HeroProps = {
  isAuthenticated?: boolean;
};

export default function Hero({ isAuthenticated = false }: HeroProps): JSX.Element {
  return (
    <section className="bg-[#f7f7f5] pb-20 pt-20 sm:pb-28 sm:pt-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b8e84]">
            YouTube Channel Growth Analysis
          </p>

          <h1 className="text-[2.25rem] font-semibold leading-[1.18] text-[#161616] sm:text-[2.75rem] lg:text-[3.25rem]">
            데이터로 설계하는
            <br />
            유튜브 성장 전략
          </h1>

          <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.7] text-[#5f6158]">
            채널 데이터를 기반으로 성장 병목과 콘텐츠 방향을 분석합니다.
            <br className="hidden sm:block" />
            감이 아닌 데이터로 다음 전략을 설계하세요.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Link
                href="/channels"
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#161616] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                대시보드로 이동
                <span aria-hidden="true" className="text-white/40">→</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#161616] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#2a2a2a] disabled:opacity-50"
              >
                Google로 시작하기
              </Link>
            )}
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-[10px] px-5 py-3 text-[14px] font-medium text-[#8b8e84] transition hover:text-[#5f6158]"
            >
              분석 과정 보기
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mx-auto mt-20 grid max-w-xl gap-px overflow-hidden rounded-xl border border-[#e5e6e1] bg-[#e5e6e1] sm:grid-cols-3">
          {[
            { value: "20", label: "영상 표본 분석" },
            { value: "30+", label: "채널 지표 계산" },
            { value: "7", label: "패턴 감지 유형" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-5 py-4 text-center">
              <p className="text-xl font-semibold tabular-nums text-[#161616]">{stat.value}</p>
              <p className="mt-0.5 text-[12px] text-[#8b8e84]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
