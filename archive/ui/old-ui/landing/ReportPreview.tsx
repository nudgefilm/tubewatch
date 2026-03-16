const FEATURES = [
  {
    label: "Metrics",
    title: "Channel Metrics",
    description:
      "평균 조회수, 좋아요 비율, 업로드 주기 등 핵심 지표를 한눈에 확인합니다.",
  },
  {
    label: "Score",
    title: "Channel Score",
    description:
      "채널 활동, 시청자 반응, SEO, 콘텐츠 구조, 성장 모멘텀 5개 영역의 종합 점수입니다.",
  },
  {
    label: "Radar",
    title: "Benchmark Radar",
    description:
      "성장 채널 기준값과 비교해 현재 채널의 위치를 레이더 차트로 시각화합니다.",
  },
  {
    label: "Patterns",
    title: "Detected Patterns",
    description:
      "업로드 빈도, 콘텐츠 길이, 조회수 편차 등에서 자동 감지된 채널 패턴입니다.",
  },
  {
    label: "AI",
    title: "AI Insights",
    description:
      "채널 요약, 강점, 약점, 병목 요인, 성장 액션 플랜을 AI가 생성합니다.",
  },
  {
    label: "Strategy",
    title: "Next Trend",
    description:
      "추천 주제, 타겟 시청자, 콘텐츠 방향 등 향후 전략을 제안합니다.",
  },
];

export default function ReportPreview(): JSX.Element {
  return (
    <section className="border-t border-[#e5e6e1] bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b8e84]">
            Analysis Report
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-snug text-[#161616] sm:text-3xl">
            분석 리포트에서 확인할 수 있는 것
          </h2>
          <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6158]">
            하나의 리포트에서 채널의 현재 상태와 성장 전략을 모두 확인할 수 있습니다.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[#e5e6e1] bg-white p-6"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#8b8e84]">
                {feature.label}
              </span>
              <h3 className="mt-2 text-[15px] font-semibold text-[#161616]">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.65] text-[#5f6158]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
