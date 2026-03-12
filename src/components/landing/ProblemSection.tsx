const PAIN_POINTS = [
  {
    title: "정체된 조회수",
    text: "영상을 꾸준히 올리지만 조회수와 구독자 수가 정체되어 있습니다.",
  },
  {
    title: "불확실한 방향",
    text: "어떤 콘텐츠 방향이 맞는지, 현재 전략이 유효한지 확신이 없습니다.",
  },
  {
    title: "보이지 않는 병목",
    text: "채널 성장을 가로막는 구체적인 원인이 무엇인지 파악하기 어렵습니다.",
  },
];

export default function ProblemSection(): JSX.Element {
  return (
    <section className="border-t border-[#e5e6e1] bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b8e84]">
            Problem
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-snug text-[#161616] sm:text-3xl">
            왜 채널 성장은 멈출까요?
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.title}
              className="rounded-xl border border-[#e5e6e1] bg-white p-6"
            >
              <h3 className="text-[15px] font-semibold text-[#161616]">
                {point.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.7] text-[#5f6158]">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-[14px] leading-[1.7] text-[#8b8e84]">
          많은 크리에이터가 데이터 없이 감에 의존해 콘텐츠를 운영합니다.
          어떤 지표가 성장을 가로막고 있는지 모른 채 시간과 노력을 소모하고 있을 수 있습니다.
        </p>
      </div>
    </section>
  );
}
