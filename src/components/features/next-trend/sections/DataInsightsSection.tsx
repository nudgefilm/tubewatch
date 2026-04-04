"use client"

import { TrendingUp, Clock, Timer } from "lucide-react"
import type {
  TagEfficiencyVm,
  TemporalResonanceVm,
  WatchTimeCatalystVm,
} from "@/lib/next-trend/nextTrendPageViewModel"

interface DataInsightsSectionProps {
  tagEfficiency: TagEfficiencyVm[]
  temporalResonance: TemporalResonanceVm | null
  watchTimeCatalyst: WatchTimeCatalystVm | null
}

function formatViews(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}초`
  if (s === 0) return `${m}분`
  return `${m}분 ${s}초`
}

function buildCatalystMessage(vm: WatchTimeCatalystVm): string {
  const rangeText =
    vm.sweetSpotMinSec === vm.sweetSpotMaxSec
      ? formatSeconds(vm.sweetSpotMinSec)
      : `${formatSeconds(vm.sweetSpotMinSec)} ~ ${formatSeconds(vm.sweetSpotMaxSec)}`

  const formatHint =
    vm.formatLabel === "숏폼"
      ? "숏폼 중심으로 유지하세요."
      : vm.formatLabel === "롱폼"
      ? "충분한 깊이의 롱폼을 유지하세요."
      : `숏폼보다는 이 구간의 ${vm.formatLabel}에 집중하세요.`

  return `당신의 채널에서 조회수가 터지는 '마법의 구간'은 ${rangeText}입니다. 다음 영상 기획 시 ${formatHint}`
}

export function NextTrendDataInsightsSection({
  tagEfficiency,
  temporalResonance,
  watchTimeCatalyst,
}: DataInsightsSectionProps) {
  const hasTag = tagEfficiency.length > 0
  const hasTemporal = temporalResonance != null
  const hasWTC = watchTimeCatalyst != null

  if (!hasTag && !hasTemporal && !hasWTC) return null

  const hasPairCards = hasTag || hasTemporal

  return (
    <div className="space-y-4">
      {/* Watch Time Catalyst — 전체 너비 */}
      {hasWTC && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Timer className="size-4 text-primary" />
              <h3 className="text-base font-semibold">최적 영상 길이 (Sweet Spot)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Shorts 제외, 조회수 상위 {watchTimeCatalyst.topSampleCount}편의 영상 길이를 분석했습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* 스윗스팟 */}
            <div className="rounded-xl border bg-primary/5 px-4 py-3 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                골든 타임 구간
              </p>
              {watchTimeCatalyst.sweetSpotMinSec === watchTimeCatalyst.sweetSpotMaxSec ? (
                <p className="text-2xl font-bold tabular-nums text-primary leading-tight">
                  {formatSeconds(watchTimeCatalyst.sweetSpotMinSec)}
                </p>
              ) : (
                <div className="text-2xl font-bold tabular-nums text-primary leading-snug">
                  <p>{formatSeconds(watchTimeCatalyst.sweetSpotMinSec)}</p>
                  <p className="text-lg text-primary/70">~ {formatSeconds(watchTimeCatalyst.sweetSpotMaxSec)}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">{watchTimeCatalyst.formatLabel}</p>
            </div>
            {/* 상위 10% 평균 */}
            <div className="rounded-xl border bg-muted/20 px-4 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                상위 10% 평균
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {formatSeconds(watchTimeCatalyst.sweetSpotAvgSec)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {watchTimeCatalyst.topSampleCount}편 기준
              </p>
            </div>
            {/* 채널 전체 평균 */}
            <div className="rounded-xl border bg-muted/20 px-4 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                채널 전체 평균
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {formatSeconds(watchTimeCatalyst.overallAvgSec)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {watchTimeCatalyst.totalSampleCount}편 기준
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
            {buildCatalystMessage(watchTimeCatalyst)}
          </p>
        </div>
      )}

      {/* 태그 효율성 + 시간대별 반응도 */}
      {hasPairCards && (
        <div className={`grid gap-4 ${hasTag && hasTemporal ? "lg:grid-cols-2" : ""}`}>

          {/* 태그 효율성 */}
          {hasTag && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-4 text-primary" />
                  <h3 className="text-base font-semibold">태그 효율성</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  평균 조회수 대비 높은 성과를 낸 태그입니다. 다음 영상 기획에 우선 적용하세요.
                </p>
              </div>
              <div className="space-y-2">
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
                  <p className="text-xs leading-relaxed text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
                    &apos;{tagEfficiency[0].tag}&apos; 태그를 달았을 때 평소보다 조회수가{" "}
                    <span className="font-semibold text-foreground">{tagEfficiency[0].multiplier}배</span>{" "}
                    높았습니다. 다음 영상도 이 태그를 축으로 기획하세요.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 시간대별 반응도 */}
          {hasTemporal && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="size-4 text-primary" />
                  <h3 className="text-base font-semibold">시간대별 반응도</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  표본 내 요일별 참여율 패턴입니다. 업로드 타이밍 참고용으로 활용하세요.
                </p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-center space-y-1">
                <p className="text-3xl font-bold tabular-nums text-primary">
                  +{temporalResonance.liftPercent}%
                </p>
                <p className="text-sm font-semibold text-primary">
                  {temporalResonance.dayLabel} 업로드 시{" "}
                  <span className="text-primary/80">{temporalResonance.metric} 참여율</span>
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  표본 {temporalResonance.sampleCount}편 기준
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
                {temporalResonance.dayLabel} 업로드 시 {temporalResonance.metric} 참여율이{" "}
                <span className="font-semibold text-foreground">{temporalResonance.liftPercent}%</span>{" "}
                상승합니다. 커뮤니티 활성화를 노린다면 이 요일을 활용하세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
