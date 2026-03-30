"use client"

import { SeoLabEmptyState } from "./sections/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBar } from "@/components/ui/ScoreBar"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import type { SeoLabPageViewModel } from "@/lib/seo-lab/seoLabPageViewModel"

interface SeoLabPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: SeoLabPageViewModel
  isStarterPlan?: boolean
}

export function SeoLabPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: SeoLabPageProps) {
  if (!viewModel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">SEO Lab</h1>
            <p className="mt-1 text-sm text-muted-foreground">알고리즘 침투 전략</p>
          </div>
          <ChannelContextHeader channelContext={channelContext} />
          <div className="mt-6">
            <SeoLabEmptyState channelId={channelId || undefined} />
          </div>
        </div>
      </div>
    )
  }

  const hasData = viewModel.hasAnalysis

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">SEO Lab</h1>
          <p className="mt-1 text-sm text-muted-foreground">알고리즘 침투 전략</p>
        </div>

        <ChannelContextHeader channelContext={channelContext} />

        {!hasData && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 text-lg font-medium">SEO 데이터가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              채널 분석이 완료되면 알고리즘 침투 전략이 생성됩니다.
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

            {/* 1. 제목 분석 — 클릭을 부르는 제목의 마법 */}
            {(viewModel.recommendedTitlePatterns.length > 0 || viewModel.titleSamples.length > 0) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">제목 분석 — 클릭을 부르는 제목의 마법</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">제목을 바로 수정하세요 — 클릭을 막는 요소를 진단하고 개선 방향을 제시합니다</p>
                </div>

                {viewModel.recommendedTitlePatterns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">지금 제목에 적용할 구조 패턴</p>
                    {viewModel.recommendedTitlePatterns.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-3">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.shortReason}</p>
                        <Badge variant="outline" className="mt-2 text-xs">{item.signalSource}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {viewModel.titleSamples.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">바로 적용 예시 — 이 구조로 제목을 수정하세요</p>
                    {viewModel.titleSamples.map((sample, i) => (
                      <div key={i} className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-sm font-medium">{sample.title}</p>
                        {sample.directionHint && (
                          <p className="text-xs text-primary font-medium mt-1">{sample.directionHint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Paywall — Starter 전용 */}
            {isStarterPlan && hasData && (
              <FeaturePaywallBlock
                title="진단만으로는 부족합니다. 이제 제목·키워드 전략까지 연결하세요."
                description="실제 노출 전략은 Growth에서 이어집니다."
                ctaLabel="지금 SEO 전략 설계하기"
                planLabel="Growth"
                previewHint="키워드 조합과 제목 구조까지 이어집니다"
              />
            )}

            {/* 2. 태그/키워드 — 알고리즘이 좋아하는 키워드 조합 */}
            {(viewModel.recommendedKeywordAngles.length > 0 || viewModel.avoidKeywordAngles.length > 0) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">태그/키워드 — 알고리즘이 좋아하는 키워드 조합</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">지금 써야 할 키워드 조합 전략 — 이 조합으로 알고리즘 진입점을 만드세요</p>
                </div>

                {viewModel.recommendedKeywordAngles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">이 조합으로 진입하세요</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {viewModel.recommendedKeywordAngles.map((item) => (
                        <div key={item.id} className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.shortReason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewModel.avoidKeywordAngles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">이 패턴은 피하세요</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {viewModel.avoidKeywordAngles.map((item) => (
                        <div key={item.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm space-y-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.shortReason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 3. 샘플 제안 — 검색 노출 최적화 전략 */}
            {viewModel.seoStrategySummary && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">샘플 제안 — 검색 노출 최적화 전략</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">실행 가능한 전략 방향과 바로 적용 가능한 가이드를 제공합니다</p>
                </div>
                <Card>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-primary shrink-0 pt-0.5">전략 요약</span>
                      <p className="text-sm leading-relaxed">{viewModel.seoStrategySummary}</p>
                    </div>
                    {viewModel.summaryLines.length > 0 && (
                      <div className="space-y-3 border-t pt-4">
                        {viewModel.summaryLines.map((line, i) => (
                          <div key={i} className="rounded-md bg-muted/40 p-3 space-y-1">
                            <p className="text-xs font-semibold">{line.label}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{line.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 4. SEO 점수 — 노출 확률 시뮬레이션 */}
            {(viewModel.seoSectionScore != null || viewModel.structureSectionScore != null ||
              viewModel.checkCards.length > 0 || viewModel.patternInsights.length > 0) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">SEO 점수 — 노출 확률 시뮬레이션</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">지금 SEO 상태를 점수로 진단하고, 노출을 높이는 핵심 액션을 제시합니다</p>
                </div>

                {(viewModel.seoSectionScore != null || viewModel.structureSectionScore != null) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">구간 점수</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {viewModel.seoSectionScore != null && (
                        <ScoreBar
                          label="SEO 최적화"
                          score={viewModel.seoSectionScore}
                          hint={
                            viewModel.seoSectionScore >= 65
                              ? "기본 SEO 구조가 갖춰져 있습니다. 제목 앞부분 키워드 강화로 추가 노출을 노리세요."
                              : "지금은 메타 구조가 약해 노출이 제한됩니다. 제목·태그 일관성을 개선하면 점수가 올라갑니다."
                          }
                        />
                      )}
                      {viewModel.structureSectionScore != null && (
                        <ScoreBar
                          label="콘텐츠 구조"
                          score={viewModel.structureSectionScore}
                          hint={
                            viewModel.structureSectionScore >= 65
                              ? "제목 포맷과 콘텐츠 구조가 안정적입니다. 이 패턴을 유지하세요."
                              : "콘텐츠 구조가 불규칙합니다. 제목 길이와 포맷을 표본끼리 통일하세요."
                          }
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {viewModel.checkCards.length > 0 && (
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
                )}

                {viewModel.patternInsights.length > 0 && (
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
                )}
              </section>
            )}
          </>
        )}

        {viewModel.strategicComment && (
          <StrategicCommentCard data={viewModel.strategicComment} />
        )}

        {/* 다음 단계 연결 — Next Trend */}
        {hasData && (
          <PageFlowConnector
            message="이 전략으로 다음 영상을 설계하세요."
            ctaLabel="다음 영상 아이디어 보기"
            href="/next-trend"
          />
        )}
      </div>
    </div>
  )
}
