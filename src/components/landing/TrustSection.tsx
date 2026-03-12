const PIPELINE = [
  { label: "Channel Data", icon: "📡" },
  { label: "Metrics Engine", icon: "📊" },
  { label: "Pattern Detection", icon: "🔎" },
  { label: "AI Interpretation", icon: "🤖" },
  { label: "Analysis Confidence", icon: "🛡️" },
];

export default function TrustSection(): JSX.Element {
  return (
    <section className="bg-gray-950 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Trust & Reliability
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            데이터 기반 분석 시스템
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-400">
            TubeWatch는 AI의 추측에 의존하지 않습니다.
            <br className="hidden sm:block" />
            정량 지표를 먼저 계산하고, 패턴을 감지한 후,
            <br className="hidden sm:block" />
            그 위에서 AI가 해석합니다.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3">
                <span className="text-lg">{step.icon}</span>
                <span className="text-sm font-semibold text-gray-200">{step.label}</span>
              </div>
              {i < PIPELINE.length - 1 ? (
                <span className="text-gray-600">→</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <p className="text-3xl font-bold text-emerald-400">100%</p>
            <p className="mt-2 text-sm font-medium text-gray-300">지표 기반 분석</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              모든 인사이트는 정량 지표와 감지된 패턴에 근거합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <p className="text-3xl font-bold text-blue-400">3단계</p>
            <p className="mt-2 text-sm font-medium text-gray-300">신뢰도 검증</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              데이터 표본, 지표 완전성, 패턴 검출을 기반으로 신뢰도를 계산합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <p className="text-3xl font-bold text-amber-400">투명</p>
            <p className="mt-2 text-sm font-medium text-gray-300">분석 근거 공개</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              리포트에 분석 신뢰도와 근거가 함께 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
