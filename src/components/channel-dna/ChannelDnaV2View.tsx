"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import ChannelDnaRadar from "@/components/analysis/ChannelDnaRadar";
import { Progress } from "@/components/ui/progress";
import type { ChannelMetrics } from "@/lib/analysis/engine/types";
import type {
  ChannelDnaPageData,
  ChannelDnaCompareItem,
  ChannelDnaSpecViewModel,
  ChannelDnaSpecLine,
  ChannelDnaSourceTag,
} from "./channelDnaPageTypes";

type ChannelDnaV2ViewProps = {
  data: ChannelDnaPageData;
  spec: ChannelDnaSpecViewModel;
};

function sourceLabel(source: ChannelDnaSourceTag): string {
  switch (source) {
    case "youtube_api":
      return "YouTube API";
    case "computed":
      return "계산";
    case "ai_interpretation":
      return "TubeWatch 엔진 분석";
    default: {
      const _e: never = source;
      return _e;
    }
  }
}

function snapshotToChannelMetrics(snapshot: unknown): ChannelMetrics | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = (snapshot as Record<string, unknown>).metrics;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  return {
    avgViewCount: typeof m.avgViewCount === "number" ? m.avgViewCount : 0,
    medianViewCount: typeof m.medianViewCount === "number" ? m.medianViewCount : 0,
    avgLikeRatio: typeof m.avgLikeRatio === "number" ? m.avgLikeRatio : 0,
    avgCommentRatio: typeof m.avgCommentRatio === "number" ? m.avgCommentRatio : 0,
    avgVideoDuration: typeof m.avgVideoDuration === "number" ? m.avgVideoDuration : 0,
    avgUploadIntervalDays:
      typeof m.avgUploadIntervalDays === "number" ? m.avgUploadIntervalDays : 0,
    recent30dUploadCount:
      typeof m.recent30dUploadCount === "number" ? m.recent30dUploadCount : 0,
    avgTitleLength: typeof m.avgTitleLength === "number" ? m.avgTitleLength : 0,
    avgTagCount: typeof m.avgTagCount === "number" ? m.avgTagCount : 0,
  };
}

function SpecLineGrid({ items }: { items: ChannelDnaSpecLine[] }): JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`spec-line-${index}-${item.label}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {item.label}
            </h4>
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {sourceLabel(item.source)}
            </span>
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

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

function scoreDelta(item: ChannelDnaCompareItem): number {
  return item.current_score - item.baseline_score;
}

function StatusBadge({
  item,
}: {
  item: ChannelDnaCompareItem;
}): JSX.Element {
  const delta = scoreDelta(item);
  const isPositive = delta >= 0;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isPositive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {isPositive ? "기준 이상" : "개선 필요"}{" "}
      <span className="ml-1 text-[11px] text-slate-400">
        ({delta > 0 ? "+" : ""}
        {delta})
      </span>
    </span>
  );
}

function ChannelDnaMetricCard({
  item,
}: {
  item: ChannelDnaCompareItem;
}): JSX.Element {
  const delta = scoreDelta(item);

  return (
    <li className="p-4 rounded-xl border bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {item.status_label}
          </p>
          <h3 className="text-sm font-semibold text-slate-900 break-words">
            {item.title}
          </h3>
        </div>
        <StatusBadge item={item} />
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-slate-900">
            {item.current_score}
          </span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
        <div className="flex flex-1 items-center justify-between text-xs text-slate-500">
          <span>기준 {item.baseline_score}점</span>
          <span
            className={
              delta >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"
            }
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        출처: <span className="font-medium text-slate-600">{item.source}</span>
      </p>
    </li>
  );
}

export default function ChannelDnaV2View({
  data,
  spec,
}: ChannelDnaV2ViewProps): JSX.Element {
  const { channels, selectedChannel, latestResult, compareItems, summaries } =
    data;
  const hasChannels = channels.length > 0;
  const hasResult = latestResult !== null;
  const hasItems = hasResult && compareItems.length > 0;

  const radarMetrics = useMemo(
    () =>
      latestResult?.feature_snapshot
        ? snapshotToChannelMetrics(latestResult.feature_snapshot)
        : null,
    [latestResult]
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10 space-y-6">
      {/* 헤더 / 채널 요약 */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-slate-500">
              채널 DNA
            </p>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              성과 구조·반복 패턴·DNA 카드
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              {spec.dataPipelineNote}
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
                  최근 분석:{" "}
                  {formatDate(selectedChannel?.last_analyzed_at ?? null)}
                </p>
              </div>
              <Link
                href="/channels"
                className="ml-1 inline-flex shrink-0 items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                채널 관리
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* 채널 선택 */}
      {hasChannels && channels.length > 1 ? (
        <section className="py-12">
          <div className="space-y-6">
        <div className="p-4 rounded-xl border bg-card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              채널 선택
            </h3>
            <p className="text-[11px] text-slate-400">
              총 {channels.length}개 채널
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {channels.map((channel) => {
              const isSelected = selectedChannel?.id === channel.id;
              return (
                <li key={channel.id}>
                  <Link
                    href={`/channel-dna?channelId=${encodeURIComponent(
                      channel.id
                    )}`}
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
          </div>
        </section>
      ) : null}

      {hasResult ? (
        <section className="py-12">
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              DNA 레이더 · 강점/약점
            </h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {radarMetrics ? (
                  <ChannelDnaRadar metrics={radarMetrics} />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500">
                    표본 부족
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                    강점 패턴
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-800">
                    {spec.dnaCards.strengthPattern.body}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-900">
                    약점 패턴
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-800">
                    {spec.dnaCards.weaknessPattern.body}
                  </p>
                </div>
              </div>
            </div>
            {hasItems ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  패턴 강도 (정규화 점수)
                </p>
                <ul className="mt-4 space-y-3">
                  {compareItems.slice(0, 4).map((item) => (
                    <li key={item.title}>
                      <div className="flex justify-between gap-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">{item.title}</span>
                        <span className="tabular-nums">{item.current_score}/100</span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.max(0, item.current_score))}
                        className="mt-1.5 h-2"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 비교 카드 + 요약 */}
      {hasItems ? (
        <>
          <section className="py-12">
            <div className="space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                성과 구조 요약
              </h3>
              <SpecLineGrid
                items={[
                  spec.performanceStructure.hitDependency,
                  spec.performanceStructure.performanceDistribution,
                  spec.performanceStructure.growthModeDefinition,
                  spec.performanceStructure.growthAxisClassification,
                ]}
              />
            </div>
          </section>

          <section className="py-12">
            <div className="space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                반복 패턴 분석
              </h3>
              <SpecLineGrid
                items={[
                  spec.repetitionPatterns.highPerformerCommonalities,
                  spec.repetitionPatterns.titleStructurePatterns,
                  spec.repetitionPatterns.formatLengthRepeat,
                  spec.repetitionPatterns.topicCluster,
                  spec.repetitionPatterns.uploadVsPerformance,
                ]}
              />
            </div>
          </section>

          <section className="py-12">
            <div className="space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                DNA 카드
              </h3>
              <SpecLineGrid
                items={[
                  spec.dnaCards.strengthPattern,
                  spec.dnaCards.weaknessPattern,
                  spec.dnaCards.maintenanceCore,
                  spec.dnaCards.hitDependenceRisk,
                ]}
              />
            </div>
          </section>

          {spec.channelDnaNarrative ? (
            <section className="py-12">
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    표본 기반 통합 해석
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {spec.channelDnaNarrative}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="py-12">
            <div className="space-y-6">
          <div className="p-4 rounded-xl border bg-card">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              요약 인사이트
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {summaries.map((line, index) => (
                <li key={`summary-${index}`} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>
            </div>
          </section>

          <section className="border-t border-dashed border-slate-200/90 py-12">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    참고 지표
                  </h3>
                  <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-400">
                    저장 표본을 내부 기준과 비교한 보조 지표입니다. 위 블록을 먼저 보신 뒤 참고하세요.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  보조
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-4 opacity-95 md:grid-cols-4">
                {compareItems.slice(0, 4).map((item) => (
                  <ChannelDnaMetricCard key={item.title} item={item} />
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : (
        <section className="py-12">
          <div className="space-y-6">
        <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          {hasChannels ? (
            <div className="space-y-2">
              <p className="font-medium text-slate-800">
                아직 채널 DNA 분석을 생성할 분석 결과가 없습니다.
              </p>
              <p className="text-sm text-slate-600">
                채널 분석을 먼저 실행하면, 경쟁 채널 대비 위치를 자동으로 계산해
                드립니다.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Link
                  href="/analysis"
                  className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  채널 분석하기
                </Link>
                <Link
                  href="/channels"
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  채널 관리로 이동
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-slate-800">
                먼저 분석할 채널을 등록해 주세요.
              </p>
              <p className="text-sm text-slate-600">
                등록된 채널이 있어야 경쟁 채널 대비 위치를 계산할 수 있습니다.
              </p>
              <Link
                href="/channels"
                className="mt-2 inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                채널 등록하러 가기
              </Link>
            </div>
          )}
        </div>
          </div>
        </section>
      )}
    </div>
  );
}

