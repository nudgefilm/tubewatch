"use client"

import { AlertCircle, ArrowRight, BookOpen, Tag, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBar } from "@/components/ui/ScoreBar"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { SeoLabEmptyState } from "./sections/EmptyState"
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

        {/* 데이터 없음 */}
        {!hasData && (
          <div className="space-y-4">
            {viewModel.limitNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                {viewModel.limitNotice}
              </div>
            )}
            <div className="rounded-lg border border-dashed p-8">
              <h3 className="text-base font-medium mb-2">SEO 데이터가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                채널 분석이 완료되면 알고리즘 침투 전략이 생성됩니다.
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground text-xs">데이터 부족 이유</p>
                <p>· 표본 영상 부족</p>
              </div>
              <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                <p className="font-medium text-xs text-primary">👉 해결</p>
                <p className="text-muted-foreground">· 최소 3~5개 영상 분석 후 다시 열어주세요</p>
              </div>
            </div>
          </div>
        )}

        {hasData && (
          <>
            {viewModel.limitNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                {viewModel.limitNotice}
              </div>
            )}

            {/* [0] 지금 수정하세요 — Action Block */}
            {viewModel.actionBlockItems.length > 0 && (
              <section className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">지금 수정하세요</span>
                </div>
                <div className="space-y-2">
                  {viewModel.actionBlockItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-background p-3 border">
                      <span className="text-xs font-bold text-destructive shrink-0 mt-0.5 w-4">{i + 1}</span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-primary font-medium">👉 {item.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  적용 범위 — {viewModel.actionBlockItems[0]?.scope ?? "다음 2~3개 영상에서 수정 테스트"}
                </p>
              </section>
            )}

            {/* [1] 제목 분석 — 클릭을 부르는 제목의 마법 */}
            {(viewModel.recommendedTitlePatterns.length > 0 || viewModel.titleSamples.length > 0) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">제목 분석 — 클릭을 부르는 제목의 마법</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">지금 바로 교체할 수 있는 수정안을 제시합니다</p>
                </div>

                {/* 데이터 부족 — 표본 없음 */}
                {viewModel.titleSamples.length === 0 && (
                  <div className="rounded-lg border border-dashed p-5 space-y-2">
                    <p className="text-sm font-medium">제목 표본이 없습니다</p>
                    <p className="text-xs text-muted-foreground">· 표본 영상 부족</p>
                    <p className="text-xs text-primary font-medium">👉 해결: 최소 3~5개 영상 분석 후 다시 확인하세요</p>
                  </div>
                )}

                {viewModel.titleSamples.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">현재 제목 진단</p>
                    {viewModel.titleSamples.map((sample, i) => (
                      <Card key={i}>
                        <CardContent className="pt-4 space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-0.5">현재 제목</p>
                            <p className="text-sm font-medium">{sample.title}</p>
                          </div>
                          <div className="flex items-start gap-2 rounded-md bg-destructive/5 border border-destructive/20 p-2">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-xs text-destructive">{sample.problem}</p>
                          </div>
                          <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 p-2">
                            <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-primary font-medium">수정안: {sample.suggestion}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {viewModel.recommendedTitlePatterns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">지금 적용할 구조 패턴</p>
                    {viewModel.recommendedTitlePatterns.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium">{item.title}</p>
                          {item.placement && (
                            <Badge variant="secondary" className="text-xs shrink-0">{item.placement}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.shortReason}</p>
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

            {/* [2] 태그/키워드 — 알고리즘이 좋아하는 키워드 조합 */}
            {(viewModel.recommendedKeywordAngles.length > 0 || viewModel.avoidKeywordAngles.length > 0) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">태그/키워드 — 알고리즘이 좋아하는 키워드 조합</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">어디에 넣을지까지 명시합니다 — 위치 없는 키워드는 효과가 없습니다</p>
                </div>

                {viewModel.recommendedKeywordAngles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">추천 키워드</p>
                    {viewModel.recommendedKeywordAngles.map((item, idx) => (
                      <div key={item.id} className="rounded-lg border p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-xs font-bold text-primary shrink-0 mt-0.5">{idx + 1}.</span>
                            <p className="text-sm font-medium">{item.title}</p>
                          </div>
                          {item.placement && (
                            <Badge variant="outline" className="text-xs shrink-0 text-primary border-primary/30">
                              → {item.placement}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">{item.shortReason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {viewModel.avoidKeywordAngles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">피해야 할 패턴</p>
                    {viewModel.avoidKeywordAngles.map((item) => (
                      <div key={item.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.shortReason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* [3] 검색 노출 최적화 전략 — 복붙 가능한 템플릿 */}
            {(viewModel.titleTemplates.length > 0 || viewModel.seoStrategySummary) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">검색 노출 최적화 전략</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">복붙하세요 — 실제 적용 가능한 제목 패턴을 제시합니다</p>
                </div>

                {viewModel.seoStrategySummary && (
                  <p className="text-sm text-muted-foreground">{viewModel.seoStrategySummary}</p>
                )}

                {viewModel.titleTemplates.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">추천 제목 패턴</p>
                    {viewModel.titleTemplates.map((tmpl, i) => (
                      <div key={i} className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-xs font-semibold text-muted-foreground">{tmpl.pattern}</p>
                        </div>
                        <div className="ml-5 rounded-md bg-muted/40 px-3 py-2">
                          <p className="text-sm font-medium">"{tmpl.example}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* [4] SEO 점수 — 노출 확률 시뮬레이션 */}
            {(viewModel.seoSectionScore != null || viewModel.seoImprovedRange != null ||
              viewModel.checkCards.length > 0 || viewModel.patternInsights.length > 0) && (
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">SEO 점수 — 노출 확률 시뮬레이션</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">지금 점수와 개선 후 예상 범위를 비교합니다</p>
                </div>

                {/* 현재 → 개선 후 비교 */}
                {viewModel.seoImprovedRange != null && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">노출 확률 변화 시뮬레이션</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">현재 SEO 점수</p>
                          <p className="text-3xl font-bold text-destructive">{viewModel.seoImprovedRange.current}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">개선 시</p>
                          <p className="text-3xl font-bold text-emerald-600">
                            {viewModel.seoImprovedRange.min} ~ {viewModel.seoImprovedRange.max}
                          </p>
                          <p className="text-xs text-muted-foreground">범위 상승 가능</p>
                        </div>
                      </div>
                      {viewModel.seoImprovedRange.reasons.length > 0 && (
                        <div className="border-t pt-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">근거</p>
                          {viewModel.seoImprovedRange.reasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                              <p className="text-xs text-muted-foreground">{r}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* improved range 없을 때 ScoreBar fallback */}
                {viewModel.seoImprovedRange == null &&
                  (viewModel.seoSectionScore != null || viewModel.structureSectionScore != null) && (
                  <Card>
                    <CardContent className="pt-5 space-y-3">
                      {viewModel.seoSectionScore != null && (
                        <ScoreBar
                          label="SEO 최적화"
                          score={viewModel.seoSectionScore}
                          hint={
                            viewModel.seoSectionScore >= 65
                              ? "기본 SEO 구조가 갖춰져 있습니다. 제목 앞부분 키워드 강화로 추가 노출을 노리세요."
                              : "메타 구조가 약해 노출이 제한됩니다. 제목·태그 일관성을 개선하면 점수가 올라갑니다."
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
                  <div className="grid gap-3 md:grid-cols-2">
                    {viewModel.checkCards.map((card) => (
                      <div key={card.id} className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="font-medium text-sm">{card.itemName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{card.currentState}</p>
                        <p className="text-xs text-primary font-medium">👉 {card.improveDirection}</p>
                        {card.hint && (
                          <p className="text-xs text-muted-foreground border-t pt-2">{card.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {viewModel.patternInsights.length > 0 && (
                  <div className="space-y-3">
                    {viewModel.patternInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className={`rounded-lg border p-4 space-y-1 ${
                          insight.tone === "caution"
                            ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                            : "border-muted bg-muted/30"
                        }`}
                      >
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
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
