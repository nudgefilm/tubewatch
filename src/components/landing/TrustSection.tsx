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
    accent: "text-emerald-400",
  },
  {
    value: "3단계",
    title: "신뢰도 검증",
    description: "데이터 표본, 지표 완전성, 패턴 검출을 기반으로 신뢰도를 계산합니다.",
    accent: "text-indigo-400",
  },
  {
    value: "투명",
    title: "분석 근거 공개",
    description: "리포트에 분석 신뢰도와 근거가 함께 표시됩니다.",
    accent: "text-amber-400",
  },
];

export default function TrustSection(): JSX.Element {
  return (
    <section className="border-t border-white/[0.04] bg-[#0b0c11] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.2em] text-emerald-400/80">
            Trust & Reliability
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            데이터 기반 분석 시스템
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
            TubeWatch는 AI의 추측에 의존하지 않습니다.
            <br className="hidden sm:block" />
            정량 지표를 먼저 계산하고, 패턴을 감지한 후, 그 위에서 AI가 해석합니다.
          </p>
        </div>

        {/* Pipeline */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-1.5">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1.5">
              <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-gray-300">
                {step.label}
              </span>
              {i < PIPELINE.length - 1 ? (
                <span className="text-[10px] text-white/15">→</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Trust metrics */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-3">
          {TRUST_STATS.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <p className={`text-2xl font-semibold ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="mt-2 text-[14px] font-medium text-gray-300">
                {stat.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
