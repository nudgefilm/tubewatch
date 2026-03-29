"use client"

import { SeoLabEmptyState } from "./sections/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBar } from "@/components/ui/ScoreBar"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import type { SeoLabPageViewModel } from "@/lib/seo-lab/seoLabPageViewModel"

interface SeoLabPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: SeoLabPageViewModel
}

export function SeoLabPage({ channelId = "", channelContext, viewModel }: SeoLabPageProps) {
  // No analysis data — show empty state with CTA
  if (!viewModel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">SEO Lab</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              이 채널에서 통하는 키워드와 제목 구조를 데이터 기반으로 분석합니다
            </p>
          </div>
          <ChannelContextHeader channelContext={channelContext} />
          <div className="mt-6">
            <SeoLabEmptyState channelId={channelId || undefined} />
          </div>
        </div>
      </div>
    )
  }

  // Real data path
  const hasData = viewModel.hasAnalysis

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">SEO Lab</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            이 채널에서 통하는 키워드와 제목 구조를 데이터 기반으로 분석합니다
          </p>
        </div>

        <ChannelContextHeader channelContext={channelContext} />

        {!hasData && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 text-lg font-medium">SEO 데이터가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              채널 분석이 완료되면 SEO 최적화 데이터가 표시됩니다.
            </p>
          </div>
        )}

        {hasData && (
          <>
            {viewModel.limitNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                {viewModel.limitNotice}
              </div>
            )}

            {/* SEO 전략 요약 */}
            {viewModel.seoStrategySummary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">SEO 전략 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {viewModel.seoStrategySummary}
                  </p>
                  {viewModel.summaryLines.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {viewModel.summaryLines.map((line, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="font-medium shrink-0">{line.label}:</span>
                          <span className="text-muted-foreground">{line.body}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 구간 점수 */}
            {(viewModel.seoSectionScore != null || viewModel.structureSectionScore != null) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">구간 점수</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewModel.seoSectionScore != null && (
                    <ScoreBar label="SEO 최적화" score={viewModel.seoSectionScore} />
                  )}
                  {viewModel.structureSectionScore != null && (
                    <ScoreBar label="콘텐츠 구조" score={viewModel.structureSectionScore} />
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    채널 분석 스냅샷 기반 구간 점수 (0–100)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* SEO 점검 항목 */}
            {viewModel.checkCards.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">SEO 점검 항목</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {viewModel.checkCards.map((card) => (
                    <Card key={card.id}>
                      <CardContent className="p-4 space-y-2">
                        <p className="font-medium text-sm">{card.itemName}</p>
                        <p className="text-xs text-muted-foreground">{card.currentState}</p>
                        <p className="text-xs">{card.whyCheck}</p>
                        <p className="text-xs text-primary font-medium">{card.improveDirection}</p>
                        {card.hint && (
                          <p className="text-xs text-muted-foreground border-t pt-2">{card.hint}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 패턴 인사이트 */}
            {viewModel.patternInsights.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">패턴 인사이트</h2>
                <div className="space-y-3">
                  {viewModel.patternInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`rounded-lg border p-4 ${
                        insight.tone === "caution"
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                          : "border-muted bg-muted/30"
                      }`}
                    >
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 추천 키워드 방향 */}
            {viewModel.recommendedKeywordAngles.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">추천 키워드 방향</h2>
                <div className="flex flex-wrap gap-2">
                  {viewModel.recommendedKeywordAngles.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm space-y-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.shortReason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 피해야 할 키워드 */}
            {viewModel.avoidKeywordAngles.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">피해야 할 키워드</h2>
                <div className="flex flex-wrap gap-2">
                  {viewModel.avoidKeywordAngles.map((item) => (
                    <div key={item.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm space-y-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.shortReason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 추천 제목 패턴 */}
            {viewModel.recommendedTitlePatterns.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">추천 제목 패턴</h2>
                <div className="space-y-2">
                  {viewModel.recommendedTitlePatterns.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.shortReason}</p>
                      <Badge variant="outline" className="mt-2 text-xs">{item.signalSource}</Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 제목 샘플 */}
            {viewModel.titleSamples.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">제목 샘플</h2>
                <div className="space-y-2">
                  {viewModel.titleSamples.map((sample, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{sample.title}</p>
                      {sample.directionHint && (
                        <p className="text-xs text-muted-foreground mt-1">{sample.directionHint}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 전략 코멘트 */}
        {viewModel.strategicComment && (
          <StrategicCommentCard data={viewModel.strategicComment} />
        )}
      </div>
    </div>
  )
}
