"use client"

import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"

type Props = {
  viewModel: NextTrendPageViewModel
}

function TrendBlock({
  title,
  items,
}: {
  title: string
  items: NextTrendPageViewModel["detectedPatterns"]
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-xl border bg-card p-3 text-sm"
          >
            <p className="font-medium text-slate-900">{it.title}</p>
            <p className="mt-1 text-slate-600">{it.shortReason}</p>
            <p className="mt-1 text-xs text-slate-500">{it.evidenceSource}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function NextTrendView({ viewModel }: Props): JSX.Element {
  const {
    channelTitle,
    dataPipelineNotice,
    trendSummary,
    internal,
    extension,
    detectedPatterns,
    repeatedTopics,
    formatChanges,
    evidenceNotes,
    hasEnoughTrendSignal,
    menuStatus,
    lastRunAt,
  } = viewModel

  const hasRawSignals =
    detectedPatterns.length > 0 ||
    repeatedTopics.length > 0 ||
    formatChanges.length > 0

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
      <section className="py-12">
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Next Trend</h1>
                <p className="text-sm text-slate-500">
                  {channelTitle ?? "채널 미선택"} · 메뉴 상태: {menuStatus}
                  {lastRunAt ? ` · 최근 실행: ${lastRunAt}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/channels">채널 관리</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/analysis">분석 실행</Link>
              </Button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">{dataPipelineNotice}</p>

          <div>
            {hasEnoughTrendSignal ? (
              <Badge className="bg-emerald-600">표본 신호 충분</Badge>
            ) : (
              <Badge variant="secondary">표본 신호 제한</Badge>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">흐름 요약</CardTitle>
              <CardDescription>저장된 분석 스냅샷에서 도출한 요약입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">{trendSummary}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">다음 시도 후보</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {internal.candidates.map((c, i) => (
            <li key={i} className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-slate-500">주제 후보</p>
              <p className="mt-1 font-medium text-slate-900">{c.topic}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">추천 이유</p>
              <p className="mt-1 text-sm text-slate-700">{c.reason}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">발생 신호</p>
              <p className="mt-1 text-xs text-slate-600">{c.signal}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">포맷 추천</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">추천 포맷</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {internal.format.recommendedFormat}
          </CardContent>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">시리즈 가능성</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {internal.format.seriesPotential}
          </CardContent>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">권장 길이</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {internal.format.suggestedLength}
          </CardContent>
        </Card>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">리스크 메모</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">위험 주제</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {internal.risk.riskyTopic}
          </CardContent>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">확신도</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {internal.risk.confidence}
          </CardContent>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">확신도 근거</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {internal.risk.confidenceBasis}
          </CardContent>
        </Card>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">실행 힌트</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">제목 방향</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              {internal.hints.titleDirection}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">훅</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">{internal.hints.hook}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">썸네일</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              {internal.hints.thumbnail}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">콘텐츠 각도</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              {internal.hints.contentAngle}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">실행 액션</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">영상 기획 초안</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-slate-700">
              {internal.actions.videoPlanDraft}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">제목 + 썸네일</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-slate-700">
              {internal.actions.titleThumbnail}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">콘텐츠 플랜</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-slate-700">
              {internal.actions.contentPlan}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8">
        <Card className="border-dashed border-slate-300 bg-slate-50/80 dark:bg-slate-950/40">
          <CardHeader>
            <CardTitle className="text-base text-slate-700">{extension.headline}</CardTitle>
            <CardDescription className="text-slate-600">{extension.body}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">시즌 키워드</p>
              <p className="mt-1 text-slate-700">{extension.seasonKeywords}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">채널 적합도</p>
              <p className="mt-1 text-slate-700">{extension.channelFit}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">적용 방식</p>
              <p className="mt-1 text-slate-700">{extension.applicationMethod}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">리스크</p>
              <p className="mt-1 text-slate-700">{extension.riskNote}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {evidenceNotes.length > 0 ? (
        <section className="py-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">표본 근거 메모</CardTitle>
              <CardDescription>내부 스냅샷 집계에 쓰인 메모입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {evidenceNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {hasRawSignals ? (
        <section className="py-8">
          <details className="group rounded-xl border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              표본에서 추출한 원시 신호 (참고)
            </summary>
            <div className="mt-6 space-y-8 border-t pt-6">
              <TrendBlock title="감지된 패턴" items={detectedPatterns} />
              <TrendBlock title="반복 주제" items={repeatedTopics} />
              <TrendBlock title="포맷·구성 변화" items={formatChanges} />
            </div>
          </details>
        </section>
      ) : null}
    </div>
  )
}
