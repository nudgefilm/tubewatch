const FEATURES = [
  {
    icon: "📊",
    title: "Channel Metrics",
    description: "평균 조회수, 좋아요 비율, 업로드 주기 등 핵심 지표를 한눈에 확인합니다.",
    color: "border-blue-200 bg-blue-50",
    iconBg: "bg-blue-100",
  },
  {
    icon: "🏆",
    title: "Channel Score",
    description: "채널 활동, 시청자 반응, SEO, 콘텐츠 구조, 성장 모멘텀 5개 영역의 종합 점수입니다.",
    color: "border-emerald-200 bg-emerald-50",
    iconBg: "bg-emerald-100",
  },
  {
    icon: "📐",
    title: "Benchmark Radar",
    description: "성장 채널 기준값과 비교해 현재 채널의 위치를 레이더 차트로 시각화합니다.",
    color: "border-violet-200 bg-violet-50",
    iconBg: "bg-violet-100",
  },
  {
    icon: "🔎",
    title: "Detected Patterns",
    description: "업로드 빈도, 콘텐츠 길이, 조회수 편차 등에서 자동 감지된 채널 패턴입니다.",
    color: "border-amber-200 bg-amber-50",
    iconBg: "bg-amber-100",
  },
  {
    icon: "🤖",
    title: "AI Insights",
    description: "채널 요약, 강점, 약점, 병목 요인, 성장 액션 플랜을 AI가 생성합니다.",
    color: "border-rose-200 bg-rose-50",
    iconBg: "bg-rose-100",
  },
  {
    icon: "🚀",
    title: "Next Trend",
    description: "추천 주제, 타겟 시청자, 콘텐츠 방향 등 향후 전략을 제안합니다.",
    color: "border-sky-200 bg-sky-50",
    iconBg: "bg-sky-100",
  },
];

export default function ReportPreview(): JSX.Element {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
            Analysis Report
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            분석 리포트에서 확인할 수 있는 것
          </h2>
          <p className="mt-4 text-base text-gray-500">
            하나의 리포트에서 채널의 현재 상태와 성장 전략을 모두 확인할 수 있습니다.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl border p-6 transition hover:shadow-md ${feature.color}`}
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${feature.iconBg}`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
