"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Radio,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

export interface TopicCandidateItem {
  id: string
  rank: number
  title: string
  description: string
  momentumScore?: number | null
  candidateStatus: "signal" | "new"
  strategy: string
  analysis?: string | null
  tip?: string | null
  sourceLabel?: string | null
  cta?: string | null
}

interface TopicCandidatesSectionProps {
  data: TopicCandidateItem[]
  growthMomentum?: number | null
}

const STATUS_CONFIG = {
  signal: {
    label: "신호감지",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/50",
    icon: Radio,
  },
  new: {
    label: "신규",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
    icon: Sparkles,
  },
} as const

export function TopicCandidatesSection({ data, growthMomentum }: TopicCandidatesSectionProps) {
  const [expandedId, setExpandedId] = useState<string>(data[0]?.id ?? "")

  if (data.length === 0) return null

  return (
    <div className="space-y-2">
      {data.map((topic) => {
        const isExpanded = expandedId === topic.id
        const cfg = STATUS_CONFIG[topic.candidateStatus]
        const StatusIcon = cfg.icon

        return (
          <div
            key={topic.id}
            className={cn(
              "rounded-xl border overflow-hidden transition-colors",
              isExpanded
                ? "border-border bg-muted/20"
                : "border-border bg-background hover:border-muted-foreground/20"
            )}
          >
            {/* 카드 헤더 — 항상 표시 */}
            <button
              className="w-full p-4 flex items-start gap-3 text-left"
              onClick={() => setExpandedId(isExpanded ? "" : topic.id)}
            >
              {/* 순위 배지 */}
              <div
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5",
                  topic.rank === 1
                    ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {topic.rank}
              </div>

              {/* 본문 */}
              <div className="flex-1 min-w-0">
                {/* 1순위: 우선순위 레이블 + 모멘텀 */}
                {topic.rank === 1 && (
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <ArrowRight className="h-3 w-3" />
                      지금 1순위
                    </div>
                    {growthMomentum != null && (
                      <span className="text-xs tabular-nums font-medium text-muted-foreground">
                        성장 모멘텀 {Math.round(growthMomentum)}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm leading-relaxed break-words">{topic.title}</p>
              </div>

              {/* 우측: 접힌 상태일 때 배지 + 화살표 */}
              <div className="flex items-center gap-2 shrink-0 ml-2 mt-0.5">
                {!isExpanded && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      cfg.bg, cfg.text, cfg.border
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                )}
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </button>

            {/* 확장 콘텐츠 */}
            {isExpanded && (
              <div className="px-4 pb-4 pl-14 space-y-4">
                {/* 설명 */}
                <p className="text-sm text-muted-foreground">{topic.description}</p>

                {/* 상태 배지 + 전략 흐름 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      cfg.bg, cfg.text, cfg.border
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-foreground">{topic.strategy}</span>
                </div>

                {/* 분석 (1순위만) */}
                {topic.analysis && (
                  <p className="text-sm text-foreground/80">{topic.analysis}</p>
                )}

                {/* 팁 */}
                {topic.tip && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-1.5">
                    <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {topic.tip}
                  </p>
                )}

                {/* 추천 이유 박스 */}
                {topic.sourceLabel && (
                  <div className="p-3 rounded-md border bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">추천 이유</span>
                      {" · "}
                      {topic.sourceLabel}
                    </p>
                  </div>
                )}

                {/* CTA */}
                {topic.cta && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-semibold text-primary">{topic.cta}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
