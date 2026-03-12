const STEPS = [
  {
    step: "01",
    title: "채널 데이터 수집",
    description: "YouTube API를 통해 최근 영상 20개의 조회수, 좋아요, 댓글, 태그 등 핵심 데이터를 수집합니다.",
    icon: "📡",
  },
  {
    step: "02",
    title: "지표 계산",
    description: "평균 조회수, 좋아요 비율, 업로드 주기 등 30개 이상의 정량 지표를 계산합니다.",
    icon: "📊",
  },
  {
    step: "03",
    title: "패턴 감지",
    description: "업로드 빈도, 콘텐츠 길이, 조회수 편차 등에서 채널 특성 패턴을 자동 감지합니다.",
    icon: "🔎",
  },
  {
    step: "04",
    title: "벤치마크 비교",
    description: "계산된 지표를 성장 채널 기준값과 비교해 현재 위치를 시각화합니다.",
    icon: "📐",
  },
  {
    step: "05",
    title: "전략 리포트",
    description: "AI가 지표와 패턴을 해석해 강점, 약점, 병목, 콘텐츠 방향을 포함한 전략 리포트를 생성합니다.",
    icon: "📋",
  },
];

export default function HowItWorks(): JSX.Element {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
            How It Works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            TubeWatch 분석 과정
          </h2>
          <p className="mt-4 text-base text-gray-500">
            채널 등록부터 전략 리포트까지, 5단계로 데이터 기반 분석을 완성합니다.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative flex flex-col">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-bold tabular-nums text-blue-600">
                    STEP {step.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>

              {i < STEPS.length - 1 ? (
                <div className="mx-auto mt-3 hidden h-0 w-full items-center justify-center lg:flex">
                  <span className="text-xs text-gray-300">→</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
