"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { AnalysisSectionScores } from "@/lib/engines/analysisPageEngine"

function pastelBarClass(score: number): string {
  if (score >= 65) return "bg-sky-400/70"
  if (score >= 45) return "bg-amber-300/80"
  return "bg-rose-300/80"
}

function scoreStyle(score: number): { text: string; cls: string } {
  if (score >= 80) return { text: "양호", cls: "text-emerald-600 dark:text-emerald-400" }
  if (score >= 60) return { text: "보통", cls: "text-amber-600 dark:text-amber-400" }
  return { text: "취약", cls: "text-rose-500 dark:text-rose-400" }
}

function gaugeColor(score: number): string {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#f59e0b"
  return "#f43f5e"
}

const SECTIONS: { key: keyof Required<AnalysisSectionScores>; label: string; fullLabel: string }[] = [
  { key: "channelActivity",        label: "활동", fullLabel: "업로드 활동" },
  { key: "audienceResponse",       label: "반응", fullLabel: "시청자 반응" },
  { key: "contentStructure",       label: "구조", fullLabel: "콘텐츠 구조" },
  { key: "seoOptimization",        label: "검색", fullLabel: "SEO 검색" },
  { key: "growthMomentum",         label: "성장", fullLabel: "성장 모멘텀" },
  { key: "subscriptionConversion", label: "구독", fullLabel: "구독 전환" },
]

const INTERPRETATIONS: Record<keyof Required<AnalysisSectionScores>, [string, string, string]> = {
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

function tierOf(score: number): 0 | 1 | 2 {
  if (score >= 65) return 0
  if (score >= 45) return 1
  return 2
}

function weakestInterpretation(sectionScores?: AnalysisSectionScores): string | null {
  if (!sectionScores) return null
  const entries = (Object.entries(sectionScores) as [keyof AnalysisSectionScores, number | undefined][])
    .filter((e): e is [keyof Required<AnalysisSectionScores>, number] => e[1] != null)
  if (entries.length === 0) return null
  const [key, val] = entries.reduce((a, b) => (b[1] < a[1] ? b : a))
  const section = SECTIONS.find(s => s.key === key)
  const prefix = section?.fullLabel ?? section?.label ?? ""
  return `${prefix} — ${INTERPRETATIONS[key][tierOf(val)]}`
}

interface ScorecardSectionProps {
  score: number
  sectionScores?: AnalysisSectionScores
}

export function ScorecardSection({ score, sectionScores }: ScorecardSectionProps) {
  const R = 52
  const circumference = 2 * Math.PI * R
  const offset = circumference - (score / 100) * circumference
  const { text: grade, cls: gradeCls } = scoreStyle(score)
  const interpretation = weakestInterpretation(sectionScores)

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-[144px_1fr] gap-6 items-center">
          {/* Donut gauge */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/40" />
                <circle
                  cx="60" cy="60" r={R}
                  fill="none"
                  stroke={gaugeColor(score)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 60 60)"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold tabular-nums ${gradeCls}`}>{score}</span>
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              score >= 80
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : score >= 60
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
            }`}>{grade}</span>
          </div>

          {/* Section bars */}
          <div className="space-y-2.5">
            {SECTIONS.map(({ key, label, fullLabel }) => {
              const val = sectionScores?.[key]
              if (val == null) return null
              const { text: statusText, cls: statusCls } = scoreStyle(val)
              return (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="w-7 shrink-0 text-right text-xs text-muted-foreground cursor-default"
                    title={fullLabel}
                  >{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pastelBarClass(val)}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{Math.round(val)}</span>
                  <span className={`w-7 shrink-0 text-xs font-medium ${statusCls}`}>{statusText}</span>
                </div>
              )
            })}
            {/* 점수 기준 안내 */}
            <p className="text-[10px] text-muted-foreground/50">65+ 양호 · 45+ 보통 · ~44 취약</p>
            {interpretation && (
              <p className="text-[11px] leading-relaxed text-muted-foreground border-l-2 border-muted pl-2">{interpretation}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
