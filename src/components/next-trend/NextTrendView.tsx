"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel";

type Props = {
  viewModel: NextTrendPageViewModel;
};

function confidenceToProgress(label: string): number {
  if (label === "높음") return 88;
  if (label === "중간") return 55;
  return 28;
}

function statusForRank(
  rank1: number,
  hasEnough: boolean
): { label: string; className: string } {
  if (hasEnough && rank1 <= 2) {
    return { label: "실행 가능", className: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  }
  if (rank1 <= 4) {
    return { label: "테스트 필요", className: "border-amber-200 bg-amber-50 text-amber-900" };
  }
  return { label: "관찰", className: "border-slate-200 bg-slate-50 text-slate-700" };
}

function TrendList({
  title,
  items,
}: {
  title: string;
  items: NextTrendPageViewModel["detectedPatterns"];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li
            key={it.id}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {i + 1}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-slate-900">{it.title}</p>
              <p className="line-clamp-2 text-slate-600">{it.shortReason}</p>
              <p className="text-xs text-slate-500">{it.evidenceSource}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
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
  } = viewModel;

  const hasRawSignals =
    detectedPatterns.length > 0 || repeatedTopics.length > 0 || formatChanges.length > 0;

  const candidates = internal.candidates.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-12 lg:py-10">
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

          <div className="flex flex-wrap gap-2">
            {hasEnoughTrendSignal ? (
              <Badge className="bg-emerald-600">표본 신호 충분</Badge>
            ) : (
              <Badge variant="secondary">표본 신호 제한</Badge>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">흐름 요약</CardTitle>
                <CardDescription>저장된 분석 스냅샷에서 도출한 요약입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4 text-sm leading-relaxed text-slate-700">{trendSummary}</p>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">다음 시도 후보 (랭킹)</h2>
              <Badge variant="outline" className="text-xs">
                최대 5개 · 중복 병합됨
              </Badge>
            </div>
            {candidates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  표본 부족
                </CardContent>
              </Card>
            ) : (
              <ol className="space-y-3">
                {candidates.map((c, i) => {
                  const rank = i + 1;
                  const st = statusForRank(rank, hasEnoughTrendSignal);
                  return (
                    <li
                      key={`${c.topic}-${i}`}
                      className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex w-16 shrink-0 flex-col items-stretch gap-2">
                        <span className="text-center font-mono text-2xl font-bold tabular-nums text-slate-400">
                          {rank}
                        </span>
                        <Progress
                          value={((6 - rank) / 5) * 100}
                          className="h-2"
                          aria-label={`우선순위 ${rank}위`}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{c.topic}</p>
                          <Badge variant="outline" className={st.className}>
                            {st.label}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-sm text-slate-600">{c.reason}</p>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium text-slate-600">신호: </span>
                          {c.signal}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">포맷 추천</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">추천 포맷</CardTitle>
              </CardHeader>
              <CardContent className="line-clamp-3 text-sm text-slate-700">
                {internal.format.recommendedFormat}
              </CardContent>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base">시리즈 가능성</CardTitle>
              </CardHeader>
              <CardContent className="line-clamp-3 text-sm text-slate-700">
                {internal.format.seriesPotential}
              </CardContent>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base">권장 길이</CardTitle>
              </CardHeader>
              <CardContent className="line-clamp-3 text-sm text-slate-700">
                {internal.format.suggestedLength}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">리스크 메모</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">위험 주제</CardTitle>
              </CardHeader>
              <CardContent className="line-clamp-3 text-sm text-slate-700">
                {internal.risk.riskyTopic}
              </CardContent>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base">확신도</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{internal.risk.confidence}</Badge>
                </div>
                <Progress value={confidenceToProgress(internal.risk.confidence)} className="h-2" />
              </CardContent>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base">확신도 근거</CardTitle>
              </CardHeader>
              <CardContent className="line-clamp-4 text-sm text-slate-700">
                {internal.risk.confidenceBasis}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">실행 힌트</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">제목 방향</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-3 text-sm text-slate-700">
                  {internal.hints.titleDirection}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">훅</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-3 text-sm text-slate-700">
                  {internal.hints.hook}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">썸네일</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-3 text-sm text-slate-700">
                  {internal.hints.thumbnail}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">콘텐츠 각도</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-3 text-sm text-slate-700">
                  {internal.hints.contentAngle}
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">실행 액션</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">영상 기획 초안</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">
                  {internal.actions.videoPlanDraft}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">제목 + 썸네일</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">
                  {internal.actions.titleThumbnail}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">콘텐츠 플랜</CardTitle>
                </CardHeader>
                <CardContent className="line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">
                  {internal.actions.contentPlan}
                </CardContent>
              </Card>
            </div>
          </section>

          {evidenceNotes.length > 0 ? (
            <section>
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
            <section>
              <details className="group rounded-xl border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">
                  표본에서 추출한 원시 신호 (참고)
                </summary>
                <div className="mt-6 space-y-8 border-t pt-6">
                  <TrendList title="감지된 패턴" items={detectedPatterns} />
                  <TrendList title="반복 주제" items={repeatedTopics} />
                  <TrendList title="포맷·구성 변화" items={formatChanges} />
                </div>
              </details>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:col-span-1">
          <div className="sticky top-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">확장 (외부 연동)</p>
            <Card className="border-dashed border-slate-300 bg-slate-50/80 dark:bg-slate-950/40">
              <CardHeader>
                <CardTitle className="text-base text-slate-700">{extension.headline}</CardTitle>
                <CardDescription className="text-slate-600">{extension.body}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">시즌 키워드</p>
                  <p className="mt-1 line-clamp-3 text-slate-700">{extension.seasonKeywords}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">채널 적합도</p>
                  <p className="mt-1 line-clamp-3 text-slate-700">{extension.channelFit}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">적용 방식</p>
                  <p className="mt-1 line-clamp-3 text-slate-700">{extension.applicationMethod}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">리스크</p>
                  <p className="mt-1 line-clamp-3 text-slate-700">{extension.riskNote}</p>
                </div>
              </CardContent>
            </Card>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
              내부 표본 블록을 우선 실행에 사용하세요
            </Badge>
          </div>
        </aside>
      </div>
    </div>
  );
}
