"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowDown, ArrowUp, Inbox, Minus, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ActionPlanPageData } from "./types";
import ActionPriorityCard from "./ActionPriorityCard";
import {
  buildActionPlanStrategy,
  buildKpiStripForPriority,
  buildStrategyHeaderVm,
  numericEvidenceLine,
  type KpiMiniVm,
  type KpiStripForPriorityVm,
  type KpiStripLayout,
} from "@/lib/action-plan/buildActionPlanPresentation";

const PRIORITY_META: Record<
  "P1" | "P2" | "P3",
  {
    title: string;
    subtitle: string;
    accent: string;
    sectionShell: string;
    headingClass: string;
  }
> = {
  P1: {
    title: "P1 · 즉시 실행",
    subtitle: "오늘 바로 적용할 액션 — 최우선",
    accent: "border-amber-400/90 bg-gradient-to-br from-amber-50/95 via-white to-amber-50/40",
    sectionShell:
      "p-5 ring-2 ring-amber-400/45 shadow-xl shadow-amber-900/10 sm:p-8",
    headingClass: "text-base font-bold tracking-tight text-slate-900",
  },
  P2: {
    title: "P2 · 단기 개선",
    subtitle: "이번 주 실험·정리 (밀도 낮춤)",
    accent: "border-sky-200/80 bg-gradient-to-br from-sky-50/45 to-white/95",
    sectionShell: "p-4 shadow-sm sm:p-5",
    headingClass: "text-sm font-semibold text-slate-800",
  },
  P3: {
    title: "P3 · 중장기 전략",
    subtitle: "리듬·구조 (참고 우선)",
    accent: "border-slate-200/90 bg-gradient-to-br from-slate-50/60 to-white",
    sectionShell: "p-4 shadow-sm sm:p-4 opacity-[0.96]",
    headingClass: "text-sm font-medium text-slate-700",
  },
};

type ActionPlanV2ViewProps = {
  data: ActionPlanPageData;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function healthBadgeClass(health: "good" | "medium" | "risk"): string {
  if (health === "good") return "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-600";
  if (health === "risk") return "border-rose-200 bg-rose-600 text-white hover:bg-rose-600";
  return "border-amber-200 bg-amber-500 text-white hover:bg-amber-500";
}

function TrendGlyph({ trend }: { trend: KpiMiniVm["trend"] }): JSX.Element {
  if (trend === "up") {
    return <ArrowUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden />;
  }
  if (trend === "down") {
    return <ArrowDown className="h-3.5 w-3.5 text-rose-600" aria-hidden />;
  }
  return <Minus className="h-3.5 w-3.5 text-slate-400" aria-hidden />;
}

function kpiLayoutClasses(layout: KpiStripLayout): {
  grid: string;
  card: string;
  value: string;
  label: string;
  bar: string;
} {
  if (layout === "hero") {
    return {
      grid: "mt-4 grid gap-4 sm:grid-cols-3",
      card:
        "flex flex-col rounded-xl border-2 border-amber-200/70 bg-gradient-to-b from-white to-amber-50/35 px-4 py-4 shadow-md",
      value: "mt-2 line-clamp-2 text-lg font-bold tabular-nums text-slate-900",
      label: "text-[11px] font-bold uppercase tracking-wide text-amber-900/80",
      bar: "mt-3 h-2 bg-amber-100/80",
    };
  }
  if (layout === "compact") {
    return {
      grid: "mt-3 grid gap-2 sm:grid-cols-3",
      card:
        "flex flex-col rounded-lg border border-slate-200/90 bg-white/85 px-2.5 py-2 shadow-sm",
      value: "mt-1 line-clamp-2 text-[11px] font-medium tabular-nums text-slate-800",
      label: "text-[9px] font-semibold uppercase tracking-wide text-slate-500",
      bar: "mt-2 h-1 bg-slate-100",
    };
  }
  return {
    grid: "mt-4 grid gap-3 sm:grid-cols-3",
    card: "flex flex-col rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-3 shadow-sm",
    value: "mt-2 line-clamp-2 text-sm font-semibold tabular-nums text-slate-900",
    label: "text-[11px] font-semibold uppercase tracking-wide text-slate-500",
    bar: "mt-3 h-1.5 bg-slate-100",
  };
}

function PriorityKpiBlock({ strip }: { strip: KpiStripForPriorityVm }): JSX.Element {
  const lc = kpiLayoutClasses(strip.layout);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{strip.heading}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{strip.subline}</p>
      <div className={lc.grid}>
        {strip.items.map((k) => (
          <div key={`${strip.heading}-${k.label}`} className={lc.card}>
            <div className="flex items-center justify-between gap-2">
              <p className={lc.label}>{k.label}</p>
              <TrendGlyph trend={k.trend} />
            </div>
            <p className={lc.value}>{k.value}</p>
            <Progress
              value={k.trend === "up" ? 76 : k.trend === "down" ? 28 : 50}
              className={lc.bar}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActionPlanV2View({ data }: ActionPlanV2ViewProps): JSX.Element {
  const { channels, selectedChannel, latestResult, actions, specItems, checklist } = data;
  const hasChannels = channels.length > 0;
  const hasResult = latestResult !== null;
  const hasActions = hasResult && actions.length > 0 && specItems.length > 0;

  const headerVm = buildStrategyHeaderVm(data);
  const strategy = buildActionPlanStrategy(data);
  /** 기존 체크리스트(dos)만 Step 1–3으로 재구성 — donts는 하단 참고에만 유지 */
  const steps = [0, 1, 2].map((i) => {
    const line = checklist.dos[i];
    if (line && line.trim()) {
      return {
        step: i + 1,
        description: line,
        expected: "동일 지표 전후 비교 가능한 변화 신호",
        horizon: "2주",
      };
    }
    return {
      step: i + 1,
      description: "데이터 부족 — 분석 완료 후 단계가 채워집니다.",
      expected: "—",
      horizon: "—",
    };
  });

  const indexedSpecs = specItems.map((spec, i) => ({ spec, actionIndex: i }));

  function cardsForPriority(p: "P1" | "P2" | "P3") {
    return indexedSpecs.filter((x) => x.spec.priority === p);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-12 lg:py-10">
      {/* 헤더 */}
      <section className="border-b border-slate-200/80 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              실행 전략 엔진
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Action Plan</h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedChannel?.channel_title ?? "채널 미선택"} · TubeWatch 엔진 분석 기반
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/channels"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              채널 관리
            </Link>
            <Link
              href="/analysis"
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
            >
              분석 리포트
            </Link>
          </div>
        </div>
      </section>

      {/* 히어로: 채널 */}
      <section className="py-8">
        <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                대상 채널
              </p>
              <p className="text-sm text-slate-600">
                실행 카드는 최근 저장 스냅샷(feature_snapshot)과 동일 출처입니다.
              </p>
            </div>
            {hasChannels ? (
              <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
                {selectedChannel?.thumbnail_url ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    <Image
                      src={selectedChannel.thumbnail_url}
                      alt={selectedChannel.channel_title ?? "채널 썸네일"}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                    N/A
                  </div>
                )}
                <div className="min-w-0 text-xs">
                  <p className="truncate font-medium text-slate-900">
                    {selectedChannel?.channel_title ?? "채널을 선택하세요"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    최근 분석: {formatDate(selectedChannel?.last_analyzed_at ?? null)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {hasChannels && channels.length > 1 ? (
        <section className="pb-8">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                채널 선택
              </h2>
              <p className="text-[11px] text-slate-400">총 {channels.length}개</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {channels.map((channel) => {
                const isSelected = selectedChannel?.id === channel.id;
                return (
                  <li key={channel.id}>
                    <Link
                      href={`/action-plan?channelId=${encodeURIComponent(channel.id)}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {channel.thumbnail_url ? (
                        <div className="relative h-5 w-5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                          <Image
                            src={channel.thumbnail_url}
                            alt={channel.channel_title ?? "채널 썸네일"}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <span className="max-w-[140px] truncate">
                        {channel.channel_title ?? "이름 없음"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 1) 전략 요약 */}
      <section className="py-4">
        <Card
          className={`overflow-hidden border-slate-200/90 bg-gradient-to-br from-slate-50/95 via-white to-amber-50/40 shadow-sm`}
        >
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <CardTitle className="text-base font-semibold text-slate-900">전략 요약</CardTitle>
              <Badge className={healthBadgeClass(headerVm.health)}>{headerVm.healthLabel}</Badge>
              <span className="text-[10px] text-slate-400">현재 상태</span>
            </div>
            <CardDescription className="text-slate-600">
              요약 → 실행 순으로 읽으면 됩니다. (TubeWatch 엔진 분석)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                핵심 전략
              </p>
              <p className="mt-1 line-clamp-2 text-left font-semibold leading-snug text-slate-900">
                {headerVm.strategyOneLiner}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                추천 방향
              </p>
              <p className="mt-1 line-clamp-2 text-left text-slate-700">{headerVm.directionLine}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-white/70 px-3 py-2">
              <p className="text-[11px] font-medium text-slate-400">기대 변화 (참고)</p>
              <p className="mt-1 line-clamp-2 text-slate-600">{strategy.outcomeLine}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">실행 준비도</p>
              <Progress value={hasActions ? 82 : 18} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </section>

      {hasActions ? (
        <>
          {(["P1", "P2", "P3"] as const).map((p) => {
            const meta = PRIORITY_META[p];
            const row = cardsForPriority(p);
            const kpiStrip = buildKpiStripForPriority(data, p);
            const sectionPad = p === "P1" ? "py-8" : p === "P2" ? "py-5" : "py-4";
            return (
              <section key={p} className={sectionPad}>
                <div className={`rounded-2xl border ${meta.accent} ${meta.sectionShell}`}>
                  <div
                    className={`mb-4 flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-end sm:justify-between ${
                      p === "P1" ? "border-amber-200/70" : "border-slate-200/60"
                    }`}
                  >
                    <div>
                      {p === "P1" ? (
                        <Badge className="mb-2 border-amber-300 bg-amber-600 text-[10px] text-white hover:bg-amber-600">
                          최우선 실행
                        </Badge>
                      ) : null}
                      <h2 className={meta.headingClass}>{meta.title}</h2>
                      <p
                        className={`mt-0.5 ${
                          p === "P1" ? "text-sm text-slate-600" : "text-xs text-slate-500"
                        }`}
                      >
                        {meta.subtitle}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`w-fit ${
                        p === "P1"
                          ? "border-amber-300 text-amber-900"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {row.length}개 액션
                    </Badge>
                  </div>

                  {row.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/90 px-6 py-10 text-center">
                      <Inbox className="h-10 w-10 text-slate-300" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">이 우선순위에 할당된 액션 없음</p>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                          스냅샷·룰 기준으로는 이 단계가 비어 있을 수 있습니다. 상위 단계(P1) 또는 분석
                          갱신 후 다시 확인하세요.
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        데이터 부족 · 해당 우선순위
                      </Badge>
                    </div>
                  ) : (
                    <div className={`grid lg:grid-cols-1 ${p === "P1" ? "gap-6" : "gap-4"}`}>
                      {row.map(({ spec, actionIndex }) => (
                        <ActionPriorityCard
                          key={`${spec.priority}-${spec.action_title}-${actionIndex}`}
                          spec={spec}
                          priorityLabel={
                            p === "P1" ? "즉시" : p === "P2" ? "단기" : "중장기"
                          }
                          numericEvidence={numericEvidenceLine(
                            actions[actionIndex],
                            data.latestResult
                          )}
                          visualWeight={p === "P1" ? "emphasis" : "muted"}
                        />
                      ))}
                    </div>
                  )}

                  <div
                    className={`rounded-xl border bg-white/95 ${
                      p === "P1"
                        ? "mt-8 border-amber-200/80 p-5 shadow-inner"
                        : p === "P2"
                          ? "mt-5 border-slate-200/80 p-4"
                          : "mt-4 border-slate-200/70 p-3"
                    }`}
                  >
                    <PriorityKpiBlock strip={kpiStrip} />
                  </div>
                </div>
              </section>
            );
          })}

          {/* Step 1–3 */}
          <section className="py-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              실행 Step (1–3)
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((s) => (
                <Card key={s.step} className="border-slate-200 bg-card shadow-sm">
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit">
                      Step {s.step}
                    </Badge>
                    <CardTitle className="text-sm font-semibold leading-snug text-slate-900">
                      {s.description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-600">
                    <p className="line-clamp-2">
                      <span className="font-medium text-slate-500">예상: </span>
                      {s.expected}
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">기간: </span>
                      {s.horizon}
                    </p>
                    <Progress value={55 + s.step * 10} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 빠른 참고 — 짧게 유지 */}
          <section className="py-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              빠른 참고
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">해야 할 것</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {checklist.dos.slice(0, 4).map((line, i) => (
                      <li key={`do-${i}`} className="line-clamp-2">
                        {line}
                      </li>
                    ))}
                  </ul>
                  {checklist.dos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 부족</p>
                  ) : null}
                  <Progress value={62} className="mt-3 h-1.5" />
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">하지 말 것</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {checklist.donts.slice(0, 4).map((line, i) => (
                      <li key={`dont-${i}`} className="line-clamp-2">
                        {line}
                      </li>
                    ))}
                  </ul>
                  {checklist.donts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 부족</p>
                  ) : null}
                  <Progress value={38} className="mt-3 h-1.5 bg-rose-50" />
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-gradient-to-br from-slate-50/80 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">핵심 1개</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm font-semibold text-slate-900">
                    {checklist.core_single_action || "데이터 부족"}
                  </p>
                  <Progress value={72} className="mt-3 h-1.5" />
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      ) : (
        <section className="py-10">
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 shadow-sm">
            <div className="flex flex-col gap-4 px-6 py-10 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertCircle className="h-8 w-8" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <Badge variant="secondary" className="mb-2 text-[10px]">
                    전용 안내
                  </Badge>
                  <h2 className="text-lg font-semibold text-slate-900">액션 플랜을 불러올 수 없습니다</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    최근 <strong className="text-slate-800">성공 분석 스냅샷</strong>이 없거나, 액션 카드를
                    구성할 표본이 부족합니다. TubeWatch 엔진 분석이 완료되면 이 화면이 자동으로 채워집니다.
                  </p>
                </div>
                <Progress value={14} className="h-2 max-w-md bg-slate-100" />
                <p className="text-xs text-slate-500">준비도 낮음 — 아래에서 분석을 실행하거나 채널을 확인하세요.</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href="/analysis"
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
                  >
                    분석 실행하기
                  </Link>
                  <Link
                    href="/channels"
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    채널 관리
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
