import Link from "next/link";

export default function SeoLabEmptyState(): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-md text-center">
        <p className="text-3xl">🔍</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          아직 SEO 분석 결과가 없습니다.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          채널 관리에서 채널을 등록하고 분석을 실행해 주세요.
        </p>
        <Link
          href="/channels"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          채널 관리로 이동
        </Link>
      </div>
    </section>
  );
}
