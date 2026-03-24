"use client";

import Link from "next/link";
import Image from "next/image";
import type { ChannelDnaPageData, ChannelDnaCompareItem } from "./channelDnaPageTypes";

type ChannelDnaV2ViewProps = {
  data: ChannelDnaPageData;
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
          <h3 className="text-sm font-display font-semibold text-slate-900 break-words">
            {item.title}
          </h3>
        </div>
        <StatusBadge item={item} />
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-display font-semibold text-slate-900">
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
}: ChannelDnaV2ViewProps): JSX.Element {
  const { channels, selectedChannel, latestResult, compareItems, summaries } =
    data;
  const hasChannels = channels.length > 0;
  const hasResult = latestResult !== null;
  const hasItems = hasResult && compareItems.length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 / 채널 요약 */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-slate-500">
              채널 DNA
            </p>
            <h2 className="text-lg font-display font-semibold text-slate-900 sm:text-xl">
              경쟁 채널 대비 현재 위치
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              핵심 지표 기준으로 내 채널의 강점과 개선 우선순위를 비교합니다.
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

      {/* 비교 카드 + 요약 */}
      {hasItems ? (
        <>
          <section className="py-12">
            <div className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                핵심 지표 비교
              </h3>
              <p className="text-xs text-slate-500">
                구독자 대비 조회수, 업로드 빈도, 반응 등을 기준으로 비교합니다.
              </p>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {compareItems.slice(0, 4).map((item) => (
                <ChannelDnaMetricCard key={item.title} item={item} />
              ))}
            </ul>
            </div>
          </section>

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

