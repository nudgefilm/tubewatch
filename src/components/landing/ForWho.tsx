const PERSONAS = [
  {
    icon: "📉",
    title: "성장이 정체된 채널",
    description:
      "조회수가 정체되고 구독자 증가가 멈춘 채널. 어떤 지표가 병목인지 파악하고 개선 방향을 찾고 싶은 크리에이터.",
    accent: "border-red-200 bg-red-50",
  },
  {
    icon: "🤔",
    title: "콘텐츠 방향이 불확실한 채널",
    description:
      "어떤 콘텐츠를 만들어야 할지, 현재 방향이 맞는지 확신이 없는 크리에이터. 데이터에서 힌트를 얻고 싶은 경우.",
    accent: "border-amber-200 bg-amber-50",
  },
  {
    icon: "📊",
    title: "데이터 기반 전략을 원하는 채널",
    description:
      "감이 아닌 지표와 패턴 분석으로 채널 운영 전략을 설계하고 싶은 크리에이터.",
    accent: "border-blue-200 bg-blue-50",
  },
];

export default function ForWho(): JSX.Element {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-600">
            Who This Is For
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            이런 채널에 추천합니다
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {PERSONAS.map((persona) => (
            <div
              key={persona.title}
              className={`rounded-2xl border p-6 transition hover:shadow-md ${persona.accent}`}
            >
              <span className="text-3xl">{persona.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{persona.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {persona.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
