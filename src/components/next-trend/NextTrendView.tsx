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
    <section className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="p-4 rounded-xl border bg-card text-sm"
          >
            <p className="font-medium text-slate-900">{it.title}</p>
            <p className="mt-1 text-slate-600">{it.shortReason}</p>
            <p className="mt-1 text-xs text-slate-500">{it.evidenceSource}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function NextTrendView({ viewModel }: Props): JSX.Element {
  const {
    channelTitle,
    scopeNotice,
    trendSummary,
    detectedPatterns,
    repeatedTopics,
    formatChanges,
    evidenceNotes,
    hasEnoughTrendSignal,
    menuStatus,
    lastRunAt,
  } = viewModel

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

          <p className="text-xs leading-relaxed text-slate-500">{scopeNotice}</p>

          <div>
            {hasEnoughTrendSignal ? (
              <Badge className="bg-emerald-600">표본 신호 충분</Badge>
            ) : (
              <Badge variant="secondary">표본 신호 제한</Badge>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
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

      <section className="py-12">
        <div className="space-y-6">
          <TrendBlock title="감지된 패턴" items={detectedPatterns} />
          <TrendBlock title="반복 주제" items={repeatedTopics} />
          <TrendBlock title="포맷·구성 변화" items={formatChanges} />
        </div>
      </section>

      {evidenceNotes.length > 0 ? (
        <section className="py-12">
          <div className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">근거 메모</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {evidenceNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  )
}
