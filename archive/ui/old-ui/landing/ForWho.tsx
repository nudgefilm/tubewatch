const PERSONAS = [
  {
    title: "성장이 정체된 채널",
    description:
      "조회수가 정체되고 구독자 증가가 멈춘 채널. 어떤 지표가 병목인지 파악하고 개선 방향을 찾고 싶은 크리에이터.",
  },
  {
    title: "콘텐츠 방향이 불확실한 채널",
    description:
      "어떤 콘텐츠를 만들어야 할지, 현재 방향이 맞는지 확신이 없는 크리에이터. 데이터에서 힌트를 얻고 싶은 경우.",
  },
  {
    title: "데이터 기반 전략을 원하는 채널",
    description:
      "감이 아닌 지표와 패턴 분석으로 채널 운영 전략을 설계하고 싶은 크리에이터.",
  },
];

export default function ForWho(): JSX.Element {
  return (
    <section className="border-t border-[#e5e6e1] bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b8e84]">
            Who This Is For
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-snug text-[#161616] sm:text-3xl">
            이런 채널에 추천합니다
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PERSONAS.map((persona) => (
            <div
              key={persona.title}
              className="rounded-xl border border-[#e5e6e1] bg-white p-6"
            >
              <h3 className="text-[15px] font-semibold text-[#161616]">
                {persona.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.65] text-[#5f6158]">
                {persona.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
