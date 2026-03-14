import Link from "next/link";

type CTASectionProps = {
  isAuthenticated?: boolean;
};

export default function CTASection({ isAuthenticated = false }: CTASectionProps): JSX.Element {
  return (
    <section className="bg-[#f7f7f5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#e5e6e1] bg-white px-8 py-14 text-center sm:px-14 sm:py-16">
          <h2 className="text-[1.75rem] font-semibold leading-snug text-[#161616] sm:text-3xl">
            지금 채널을 분석해 보세요
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-[1.7] text-[#5f6158]">
            채널을 등록하면 데이터 수집부터 전략 리포트까지 자동으로 진행됩니다.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Link
                href="/channels"
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#161616] px-7 py-3 text-[15px] font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                대시보드로 이동
                <span aria-hidden="true" className="text-white/40">→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#161616] px-7 py-3 text-[15px] font-semibold text-white transition hover:bg-[#2a2a2a] disabled:opacity-50"
                >
                  Google로 시작하기
                </Link>
                <Link
                  href="/channels"
                  className="inline-flex items-center rounded-[10px] px-5 py-3 text-[14px] font-medium text-[#8b8e84] transition hover:text-[#5f6158]"
                >
                  먼저 둘러보기
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
