"use client"

import { Sparkles, AlertCircle, CheckCircle2, MinusCircle, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SeoKeywordVm } from "@/lib/action-plan/actionPlanPageViewModel"

interface KeywordSectionProps {
  data: SeoKeywordVm
}

const DESC_STATUS_CONFIG = {
  too_short: {
    icon: AlertCircle,
    iconClass: "text-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    label: "개선 필요",
  },
  moderate: {
    icon: MinusCircle,
    iconClass: "text-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    label: "보통",
  },
  good: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "양호",
  },
}

function formatViews(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function ActionPlanKeywordSection({ data }: KeywordSectionProps) {
  const { goldenKeywords, missingKeywords, descriptionStats, hasTagData, sampleSize } = data

  const hasAnyContent = hasTagData || descriptionStats != null
  if (!hasAnyContent) return null

  return (
    <div className="space-y-4">
      {/* 황금 키워드 */}
      {hasTagData && goldenKeywords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-amber-500" />
                  황금 키워드
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  표본 {sampleSize}편 중 상위 성과 영상에서 반복 사용된 태그입니다. 다음 영상에 우선 적용하세요.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {goldenKeywords.map((k) => (
                <div
                  key={k.tag}
                  className="group relative flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-sm transition-colors hover:bg-amber-100/70"
                >
                  <span className="font-medium text-amber-800">{k.tag}</span>
                  <span className="tabular-nums text-xs text-amber-600/80">
                    {k.usageCount}편
                  </span>
                  {k.avgViews > 0 && (
                    <span className="tabular-nums text-xs text-amber-500/70">
                      · avg {formatViews(k.avgViews)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 누락 키워드 + 설명란 진단 — 나란히 */}
      <div className={`grid gap-4 ${missingKeywords.length > 0 && descriptionStats ? "lg:grid-cols-2" : ""}`}>

        {/* 누락 키워드 */}
        {hasTagData && missingKeywords.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="size-4 text-rose-500" />
                누락 키워드
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                상위 영상에는 있지만 하위 영상에는 빠진 태그입니다. 저성과 영상에 추가해보세요.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.map((k) => (
                  <div
                    key={k.tag}
                    className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1.5"
                  >
                    <span className="text-sm font-medium text-rose-700">{k.tag}</span>
                    <span className="tabular-nums text-xs text-rose-500/80">
                      상위 {k.topOnlyCount}편
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 설명란 진단 */}
        {descriptionStats && (() => {
          const cfg = DESC_STATUS_CONFIG[descriptionStats.status]
          const Icon = cfg.icon
          return (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`size-4 ${cfg.iconClass}`} />
                    설명란 진단
                  </CardTitle>
                  <Badge variant="outline" className={cfg.badgeClass}>
                    {cfg.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 수치 요약 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">평균 길이</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {descriptionStats.avgLength}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">자</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-50/60 p-3 text-center">
                    <p className="text-xs text-rose-600/80">100자 미만</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-rose-700">
                      {descriptionStats.shortCount}
                      <span className="ml-0.5 text-xs font-normal">편</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50/60 p-3 text-center">
                    <p className="text-xs text-emerald-600/80">300자 이상</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700">
                      {descriptionStats.goodCount}
                      <span className="ml-0.5 text-xs font-normal">편</span>
                    </p>
                  </div>
                </div>

                {/* 가이드 텍스트 */}
                <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                  <Icon className={`mt-0.5 size-3.5 shrink-0 ${cfg.iconClass}`} />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {descriptionStats.guideText}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>
    </div>
  )
}
