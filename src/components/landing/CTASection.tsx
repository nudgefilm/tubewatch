import Link from "next/link";

export default function CTASection(): JSX.Element {
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
          <Link
            href="/channels"
            className="mt-8 inline-flex items-center rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-gray-800"
          >
            채널 분석 시작
          </Link>
        </div>
      </div>
    </section>
  );
}
