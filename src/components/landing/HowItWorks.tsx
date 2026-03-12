const STEPS = [
  {
    step: "01",
    title: "채널 데이터 수집",
    description:
      "YouTube API를 통해 최근 영상 20개의 조회수, 좋아요, 댓글, 태그 등 핵심 데이터를 수집합니다.",
  },
  {
    step: "02",
    title: "지표 계산",
    description:
      "평균 조회수, 좋아요 비율, 업로드 주기 등 30개 이상의 정량 지표를 계산합니다.",
  },
  {
    step: "03",
    title: "패턴 감지",
    description:
      "업로드 빈도, 콘텐츠 길이, 조회수 편차 등에서 채널 특성 패턴을 자동 감지합니다.",
  },
  {
    step: "04",
    title: "벤치마크 비교",
    description:
      "계산된 지표를 성장 채널 기준값과 비교해 현재 위치를 시각화합니다.",
  },
  {
    step: "05",
    title: "전략 리포트",
    description:
      "AI가 지표와 패턴을 해석해 강점, 약점, 병목, 콘텐츠 방향을 포함한 전략 리포트를 생성합니다.",
  },
];

export default function HowItWorks(): JSX.Element {
  return (
    <section id="how-it-works" className="bg-[#f7f7f5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b8e84]">
            How It Works
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-snug text-[#161616] sm:text-3xl">
            TubeWatch 분석 과정
          </h2>
          <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6158]">
            채널 등록부터 전략 리포트까지, 5단계로 데이터 기반 분석을 완성합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative flex flex-col">
              <div className="flex h-full flex-col rounded-xl border border-[#e5e6e1] bg-white p-5">
                <span className="mb-3 text-[11px] font-semibold tabular-nums tracking-wide text-[#8b8e84]">
                  STEP {step.step}
                </span>
                <h3 className="text-[15px] font-semibold text-[#161616]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.65] text-[#5f6158]">
                  {step.description}
                </p>
              </div>

              {i < STEPS.length - 1 ? (
                <div className="mx-auto mt-2 hidden items-center justify-center lg:flex">
                  <span className="text-[10px] text-[#c8c9c3]">→</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
