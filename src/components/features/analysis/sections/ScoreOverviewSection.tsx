"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type SectionScores = {
  channelActivity?: number
  audienceResponse?: number
  contentStructure?: number
  seoOptimization?: number
  growthMomentum?: number
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
    "업로드 리듬이 안정적으로 유지되고 있는 상태입니다",
    "업로드 간격이 불규칙하여 채널 운영 리듬이 흔들리고 있는 상태입니다",
    "업로드 일관성이 낮아 채널 리듬이 무너진 상태입니다",
  ],
  audienceResponse: [
    "시청자 반응이 콘텐츠 방향성과 잘 맞아떨어지고 있는 상태입니다",
    "시청 반응은 있으나 타깃 적합성이 아직 충분히 구축되지 않은 상태입니다",
    "조회 반응 지표가 콘텐츠와 맞지 않아 이탈이 발생하고 있는 상태입니다",
  ],
  contentStructure: [
    "성과 포맷이 반복적으로 재현되고 있는 안정적인 구조 상태입니다",
    "성과 포맷은 보이지만 전개 구조의 재현성이 더 보강이 필요한 상태입니다",
    "콘텐츠 구조 일관성이 낮아 시청 유지에 취약한 상태입니다",
  ],
  seoOptimization: [
    "키워드 구조와 제목 최적화가 검색 유입에 충분히 기여하고 있는 상태입니다",
    "검색 유입을 받을 키워드 구조가 아직 충분히 정리되지 않은 상태입니다",
    "제목과 키워드 설계가 검색 노출을 이끌어내기 어려운 상태입니다",
  ],
  growthMomentum: [
    "조회 성장 흐름이 지속 가능한 구조로 형성되고 있는 상태입니다",
    "성장 신호는 보이지만 재현 가능한 성장 구조가 아직 굳어지지 않은 상태입니다",
    "뚜렷한 성장 신호가 감지되지 않고 있는 상태입니다",
  ],
}

const SECTION_DISPLAY: { key: SectionKey; label: string }[] = [
  { key: "channelActivity",  label: "활동" },
  { key: "audienceResponse", label: "반응" },
  { key: "contentStructure", label: "구조" },
  { key: "seoOptimization",  label: "발견" },
  { key: "growthMomentum",   label: "성장" },
]

function tierOf(score: number): 0 | 1 | 2 {
  if (score >= 80) return 0
  if (score >= 60) return 1
  return 2
}

function sectionBarColor(score: number) {
  if (score >= 65) return "bg-emerald-500"
  if (score >= 45) return "bg-amber-400"
  return "bg-rose-400"
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
  if (overallScore >= 80) return "전반적인 채널 지표가 안정적으로 관리되고 있는 상태입니다"
  if (overallScore >= 60) return "일부 지표가 기준치 내에 있으나 개선 여지가 있는 상태입니다"
  return "핵심 지표 다수에서 기준치 미달이 감지된 상태입니다"
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
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${sectionBarColor(val)}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(val)}
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
