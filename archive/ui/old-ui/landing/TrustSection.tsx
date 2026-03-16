const PIPELINE = [
  { label: "Channel Data" },
  { label: "Metrics Engine" },
  { label: "Pattern Detection" },
  { label: "AI Interpretation" },
  { label: "Confidence Score" },
];

const TRUST_STATS = [
  {
    value: "100%",
    title: "지표 기반 분석",
    description: "모든 인사이트는 정량 지표와 감지된 패턴에 근거합니다.",
  },
  {
    value: "3단계",
    title: "신뢰도 검증",
    description: "데이터 표본, 지표 완전성, 패턴 검출을 기반으로 신뢰도를 계산합니다.",
  },
  {
    value: "투명",
    title: "분석 근거 공개",
    description: "리포트에 분석 신뢰도와 근거가 함께 표시됩니다.",
  },
];

export default function TrustSection(): JSX.Element {
  return (
    <section className="bg-[#f2f3ef] py-20 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b8e84]">
            Trust & Reliability
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-snug text-[#161616] sm:text-3xl">
            데이터 기반 분석 시스템
          </h2>
          <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6158]">
            TubeWatch는 AI의 추측에 의존하지 않습니다.
            <br className="hidden sm:block" />
            정량 지표를 먼저 계산하고, 패턴을 감지한 후, 그 위에서 AI가 해석합니다.
          </p>
        </div>

        {/* Pipeline */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <span className="rounded-lg border border-[#e5e6e1] bg-white px-4 py-2 text-[13px] font-medium text-[#161616]">
                {step.label}
              </span>
              {i < PIPELINE.length - 1 ? (
                <span className="text-[11px] text-[#c8c9c3]">→</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Trust metrics */}
        <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
          {TRUST_STATS.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-[#e5e6e1] bg-white p-6"
            >
              <p className="text-xl font-semibold text-[#6366f1]">
                {stat.value}
              </p>
              <p className="mt-2 text-[14px] font-semibold text-[#161616]">
                {stat.title}
              </p>
              <p className="mt-1 text-[13px] leading-[1.65] text-[#5f6158]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
