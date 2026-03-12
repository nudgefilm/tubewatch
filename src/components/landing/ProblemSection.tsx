const PAIN_POINTS = [
  {
    text: "영상을 꾸준히 올리지만 조회수가 늘지 않습니다",
  },
  {
    text: "어떤 콘텐츠 방향이 맞는지 확신이 없습니다",
  },
  {
    text: "채널 성장의 병목이 어디인지 알기 어렵습니다",
  },
];

export default function ProblemSection(): JSX.Element {
  return (
    <section className="bg-[#08090d] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.2em] text-red-400/80">
            Problem
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            왜 채널 성장은 멈출까요?
          </h2>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-3">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.text}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <p className="text-[15px] font-medium leading-relaxed text-gray-300">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-[15px] leading-relaxed text-gray-500">
          많은 크리에이터가 데이터 없이 감에 의존해 콘텐츠를 운영합니다.
          어떤 지표가 성장을 가로막고 있는지 모른 채
          시간과 노력을 소모하고 있을 수 있습니다.
        </p>
      </div>
    </section>
  );
}
