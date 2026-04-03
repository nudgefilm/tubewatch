"use client"

import { TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TagEfficiencyVm, TemporalResonanceVm } from "@/lib/next-trend/nextTrendPageViewModel"

interface DataInsightsSectionProps {
  tagEfficiency: TagEfficiencyVm[]
  temporalResonance: TemporalResonanceVm | null
}

function formatViews(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function NextTrendDataInsightsSection({ tagEfficiency, temporalResonance }: DataInsightsSectionProps) {
  const hasTag = tagEfficiency.length > 0
  const hasTemporal = temporalResonance != null

  if (!hasTag && !hasTemporal) return null

  return (
    <div className={`grid gap-4 ${hasTag && hasTemporal ? "lg:grid-cols-2" : ""}`}>

      {/* 태그 효율성 */}
      {hasTag && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              태그 효율성
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              평균 조회수 대비 높은 성과를 낸 태그입니다. 다음 영상 기획에 우선 적용하세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {tagEfficiency.map((item) => (
              <div
                key={item.tag}
                className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{item.tag}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {item.sampleCount}편
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    avg {formatViews(item.avgViews)}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">
                    {item.multiplier}×
                  </span>
                </div>
              </div>
            ))}
            {tagEfficiency[0] && (
              <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2 mt-1">
                &apos;{tagEfficiency[0].tag}&apos; 태그를 달았을 때 평소보다 조회수가{" "}
                <span className="font-semibold text-foreground">{tagEfficiency[0].multiplier}배</span>{" "}
                높았습니다. 다음 영상도 이 태그를 축으로 기획하세요.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 시간대별 반응도 */}
      {hasTemporal && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-primary" />
              시간대별 반응도
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              표본 내 요일별 참여율 패턴입니다. 업로드 타이밍 참고용으로 활용하세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/20 px-4 py-4 text-center space-y-1">
              <p className="text-3xl font-bold tabular-nums text-primary">
                +{temporalResonance.liftPercent}%
              </p>
              <p className="text-sm font-medium">
                {temporalResonance.dayLabel} 업로드 시 {temporalResonance.metric} 참여율
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                표본 {temporalResonance.sampleCount}편 기준
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
              {temporalResonance.dayLabel} 업로드 시 {temporalResonance.metric} 참여율이{" "}
              <span className="font-semibold text-foreground">{temporalResonance.liftPercent}%</span>{" "}
              상승합니다. 커뮤니티 활성화를 노린다면 이 요일을 활용하세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
