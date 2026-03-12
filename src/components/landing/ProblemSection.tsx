const PAIN_POINTS = [
  {
    icon: "📉",
    text: "영상을 꾸준히 올리지만 조회수가 늘지 않습니다",
  },
  {
    icon: "🤔",
    text: "어떤 콘텐츠 방향이 맞는지 확신이 없습니다",
  },
  {
    icon: "🔍",
    text: "채널 성장의 병목이 어디인지 알기 어렵습니다",
  },
];

export default function ProblemSection(): JSX.Element {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-500">
            Problem
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            왜 채널 성장은 멈출까요?
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.text}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:border-gray-300 hover:shadow-sm"
            >
              <span className="text-2xl">{point.icon}</span>
              <p className="mt-3 text-base font-medium leading-relaxed text-gray-800">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-base leading-relaxed text-gray-500">
          많은 크리에이터가 데이터 없이 감에 의존해 콘텐츠를 운영합니다.
          어떤 지표가 성장을 가로막고 있는지 모른 채
          시간과 노력을 소모하고 있을 수 있습니다.
        </p>
      </div>
    </section>
  );
}
