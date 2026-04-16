"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SegmentGauge } from "@/components/ui/SegmentGauge"

function pastelGaugeClass(score: number): string {
  if (score >= 65) return "bg-sky-400/60 border-sky-400/60"
  if (score >= 45) return "bg-amber-300/70 border-amber-300/70"
  return "bg-rose-300/70 border-rose-300/70"
}

export type SectionScores = {
  channelActivity?: number
  audienceResponse?: number
  contentStructure?: number
  seoOptimization?: number
  growthMomentum?: number
  subscriptionConversion?: number
}

interface AnalysisScoreOverviewProps {
  score: number
  sectionScores?: SectionScores
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-600"
}

function getScoreLabel(score: number) {
  if (score >= 80) return "양호"
  if (score >= 60) return "보통"
  return "개선 필요"
}

function getScoreTrackColor(score: number) {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#f59e0b"
  return "#f43f5e"
}

type SectionKey = keyof Required<SectionScores>

/** 섹션별 점수 구간(0=양호/1=보통/2=취약) × 해석 문장 */
const SECTION_INTERPRETATIONS: Record<SectionKey, [string, string, string]> = {
  channelActivity: [
    "꾸준한 발행 리듬이 유지되어 구독자 복귀 기대가 형성되기에 유리한 신호입니다",
    "발행 간격이 불규칙한 경향이 읽혀 구독자 복귀 패턴이 약해질 수 있습니다",
    "업로드 공백이 누적되어 반복 시청 가능성이 낮아지고 있는 구조일 수 있습니다",
  ],
  audienceResponse: [
    "시청자 반응 신호가 콘텐츠 방향과 맞아 있어 CTR 유지에 유리한 신호입니다",
    "반응 신호는 있으나 CTR이나 시청 지속시간이 더 안정화될 여지가 있는 경향입니다",
    "조회 반응이 낮아 초반 이탈이 높을 가능성이 있는 구조입니다",
  ],
  contentStructure: [
    "포맷 일관성이 유지되어 시청 지속시간 방어와 주제 재현성에 유리한 신호입니다",
    "성과 포맷이 일부 보이나 구조 재현성이 더 굳어져야 할 경향이 읽힙니다",
    "콘텐츠 구조 편차가 커서 시청 유지에 취약할 수 있는 구조입니다",
  ],
  seoOptimization: [
    "키워드·제목 구조가 초반 클릭 유도력과 검색 유입에 기여하고 있는 신호입니다",
    "검색 유입 가능성은 있으나 CTR을 높이는 키워드 배치가 더 정리될 여지가 있습니다",
    "제목·키워드 구조가 검색 노출을 이끌어내기 어려운 경향이 읽힙니다",
  ],
  growthMomentum: [
    "조회 성장 흐름이 지속 가능한 구조로 형성되고 있는 신호입니다",
    "성장 신호가 감지되나 히트 의존이 남아 재현 가능한 구조가 아직 굳어지지 않은 경향입니다",
    "성장 신호가 뚜렷하지 않아 평균 조회수 유지력이 약할 수 있는 구조입니다",
  ],
  subscriptionConversion: [
    "참여 구조와 콘텐츠 일관성이 구독 전환에 유리한 신호를 형성하고 있습니다",
    "구독 전환 신호가 부분적으로 감지되나 참여 일관성이 더 굳어져야 할 경향입니다",
    "구독 전환 구조가 약해 시청자가 채널을 이탈 없이 구독할 동기가 낮을 수 있습니다",
  ],
}

const SECTION_DISPLAY: { key: SectionKey; label: string }[] = [
  { key: "channelActivity",       label: "활동" },
  { key: "audienceResponse",      label: "반응" },
  { key: "contentStructure",      label: "구조" },
  { key: "seoOptimization",       label: "SEO" },
  { key: "growthMomentum",        label: "성장" },
  { key: "subscriptionConversion", label: "구독" },
]

function getSectionScoreLabel(score: number): string {
  if (score >= 80) return "양호"
  if (score >= 60) return "보통"
  return "취약"
}

function tierOf(score: number): 0 | 1 | 2 {
  if (score >= 80) return 0
  if (score >= 60) return 1
  return 2
}


function deriveInterpretation(overallScore: number, sectionScores?: SectionScores): string {
  if (sectionScores) {
    const entries = (Object.entries(sectionScores) as [SectionKey, number | undefined][]).filter(
      (e): e is [SectionKey, number] => e[1] != null
    )
    if (entries.length > 0) {
      const [weakKey, weakScore] = entries.reduce((a, b) => (b[1] < a[1] ? b : a))
      return SECTION_INTERPRETATIONS[weakKey][tierOf(weakScore)]
    }
  }
  // fallback: 전체 점수 기준
  if (overallScore >= 80) return "전반적인 채널 지표가 안정적으로 유지되어 반복 성과를 기대할 수 있는 구조입니다"
  if (overallScore >= 60) return "일부 지표가 기준치 내에 있으나 구조 재현성이 더 굳어져야 할 경향이 읽힙니다"
  return "핵심 지표 다수에서 기준치 미달이 감지되어 평균 조회수 유지력이 약할 수 있습니다"
}

export function AnalysisScoreOverview({ score, sectionScores }: AnalysisScoreOverviewProps) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          채널 종합 점수
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-5">
        {/* Donut */}
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="45"
              fill="none" stroke="currentColor" strokeWidth="10"
              className="text-muted"
            />
            <circle
              cx="60" cy="60" r="45"
              fill="none"
              stroke={getScoreTrackColor(score)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Grade badge */}
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            score >= 80
              ? "bg-emerald-50 text-emerald-700"
              : score >= 60
                ? "bg-amber-50 text-amber-700"
                : "bg-rose-50 text-rose-700"
          }`}
        >
          {getScoreLabel(score)}
        </span>

        {/* Section score mini-bars */}
        {sectionScores && (
          <div className="w-full space-y-1.5">
            {SECTION_DISPLAY.map(({ key, label }) => {
              const val = sectionScores[key]
              if (val == null) return null
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-[22px] shrink-0 text-right text-[10px] text-muted-foreground">
                    {label}
                  </span>
                  <div className="flex-1">
                    <SegmentGauge score={val} segments={8} label={false} stretch filledClassName={pastelGaugeClass(val)} />
                  </div>
                  <span className="w-5 text-right text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(val)}
                  </span>
                  <span className={`w-[22px] shrink-0 text-[10px] font-medium ${getScoreColor(val)}`}>
                    {getSectionScoreLabel(val)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Interpretation */}
        <p className="line-clamp-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          {deriveInterpretation(score, sectionScores)}
        </p>
      </CardContent>
    </Card>
  )
}
