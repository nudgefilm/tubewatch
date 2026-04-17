"use client"

import { FileWarning, ThumbsDown, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  SeoDeficitVm,
  EngagementGapVm,
  LinguisticInsightVm,
} from "@/lib/action-plan/actionPlanPageViewModel"

interface DeficitSectionProps {
  seoDeficit: SeoDeficitVm | null
  engagementGap: EngagementGapVm | null
  linguisticInsight: LinguisticInsightVm | null
}

function fmtRate(r: number): string {
  return (r * 100).toFixed(1) + "%"
}

function buildLinguisticMessage(vm: LinguisticInsightVm): string {
  const top3 = vm.ctrBoosters.slice(0, 3).map((b) => `'${b.keyword}'`).join(", ")
  const topLift = vm.ctrBoosters[0]?.liftPercent ?? 0
  return `당신 채널은 제목에 ${top3} 같은 단어가 포함될 때 클릭률이 평소보다 ${topLift}% 높습니다. 이번 제목에도 이 키워드들을 조합해 보세요.`
}

export function ActionPlanDeficitSection({ seoDeficit, engagementGap, linguisticInsight }: DeficitSectionProps) {
  if (!seoDeficit && !engagementGap && !linguisticInsight) return null

  const pairCount = (seoDeficit ? 1 : 0) + (engagementGap ? 1 : 0)
  const hasPair = pairCount === 2

  return (
    <div className="space-y-4">
      {/* SEO 결손 + 인게이지먼트 갭 — 2열 그리드 */}
      {(seoDeficit || engagementGap) && (
        <div className={`grid gap-4 ${hasPair ? "lg:grid-cols-2" : ""}`}>

          {/* SEO 결손 리포트 */}
          {seoDeficit && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileWarning className="size-4 text-muted-foreground" />
                  SEO 결손 리포트
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  지금 바로 유튜브 스튜디오에서 수정 가능한 항목입니다.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* 설명란 짧음 */}
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-0.5">
                    <p className={`text-2xl font-bold tabular-nums ${seoDeficit.shortDescCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {seoDeficit.shortDescCount}
                      <span className="text-sm font-normal ml-0.5">개</span>
                    </p>
                    <p className="text-xs text-muted-foreground">설명란 100자 미만</p>
                    <p className="text-xs text-muted-foreground">
                      전체의 {seoDeficit.shortDescPercent}%
                    </p>
                  </div>
                  {/* 태그 부족 */}
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-0.5">
                    <p className={`text-2xl font-bold tabular-nums ${seoDeficit.lowTagCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {seoDeficit.lowTagCount}
                      <span className="text-sm font-normal ml-0.5">개</span>
                    </p>
                    <p className="text-xs text-muted-foreground">태그 3개 미만</p>
                    <p className="text-xs text-muted-foreground">
                      전체의 {seoDeficit.lowTagPercent}%
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
                  {seoDeficit.shortDescCount > 0
                    ? `현재 영상 ${seoDeficit.totalCount}개 중 ${seoDeficit.shortDescCount}개가 설명란이 너무 짧습니다. 제목 핵심 키워드를 설명란에 추가하면 검색 노출 기회가 늘어납니다.`
                    : `태그가 3개 미만인 영상 ${seoDeficit.lowTagCount}개를 우선 보완하세요. 관련 태그 5~10개 추가가 권장됩니다.`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 인게이지먼트 갭 */}
          {engagementGap && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThumbsDown className="size-4 text-muted-foreground" />
                  인게이지먼트 갭
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  조회수 대비 좋아요 비율 진단 — 표본 {engagementGap.sampleCount}편 기준
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/20 px-4 py-4 text-center space-y-1">
                  <p className={`text-3xl font-bold tabular-nums ${engagementGap.hasLowEngagement ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {fmtRate(engagementGap.avgLikeRate)}
                  </p>
                  <p className="text-sm font-medium">평균 좋아요 비율</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    표본 내 {engagementGap.percentileLabel}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
                  {engagementGap.hasLowEngagement
                    ? `조회수 대비 좋아요 비율이 ${engagementGap.percentileLabel}입니다. 영상 중반부에 '좋아요 요청' 멘트를 추가하고, 커뮤니티 탭으로 시청자 참여를 유도하세요.`
                    : `좋아요 비율이 표본 ${engagementGap.percentileLabel}로 양호합니다. 현재 참여 유도 방식을 유지하세요.`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 제목 언어 분석 (Linguistic Insight) — 전체 너비 */}
      {linguisticInsight && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              클릭 유도 단어 분석
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              조회수 상위 {linguisticInsight.topSampleCount}편 제목에서 공통 발견된 키워드입니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {linguisticInsight.ctrBoosters.map((booster) => (
                <div
                  key={booster.keyword}
                  className="flex items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1.5"
                >
                  <span className="text-sm font-medium">{booster.keyword}</span>
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                    +{booster.liftPercent}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
              {buildLinguisticMessage(linguisticInsight)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
