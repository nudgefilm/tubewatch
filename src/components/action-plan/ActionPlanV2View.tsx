"use client";

import Link from "next/link";
import Image from "next/image";
import type { ActionPlanPageData } from "./types";
import ActionPriorityCard from "./ActionPriorityCard";

const PRIORITY_LABEL: Record<"P1" | "P2" | "P3", string> = {
  P1: "지금 바로",
  P2: "이번 주",
  P3: "다음 단계",
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

export default function ActionPlanV2View({
  data,
}: ActionPlanV2ViewProps): JSX.Element {
  const { channels, selectedChannel, latestResult, actions, specItems, checklist } = data;
  const hasChannels = channels.length > 0;
  const hasResult = latestResult !== null;
  const hasActions = hasResult && actions.length > 0 && specItems.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
      {/* 채널 선택 및 분석 상태 요약 */}
      <section className="py-12">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              액션 플랜
            </p>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              채널별 실행 우선순위
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              최근 분석 결과를 기반으로 지금 바로 실행할 액션을 정리했습니다.
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
          </div>
        </div>
      </section>

      {/* 채널 선택 목록 */}
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
                    href={`/action-plan?channelId=${encodeURIComponent(
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

      {/* 액션 카드 섹션 */}
      {hasActions ? (
        <>
        <section className="py-12">
          <div className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              실행 우선순위
            </h3>
            <p className="text-xs text-slate-500">
              P1–P3 · 영향 영역·근거·예상 효과 시나리오를 카드에 표시합니다.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {specItems.map((spec) => (
              <ActionPriorityCard
                key={`${spec.priority}-${spec.action_title}`}
                spec={spec}
                priorityLabel={PRIORITY_LABEL[spec.priority]}
              />
            ))}
          </div>
          </div>
        </section>
        <section className="py-12">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              체크리스트
            </h3>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">해야 할 것</p>
                <ul className="list-disc space-y-1 pl-5">
                  {checklist.dos.map((line, i) => (
                    <li key={`do-${i}`}>{line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">하지 말 것</p>
                <ul className="list-disc space-y-1 pl-5">
                  {checklist.donts.map((line, i) => (
                    <li key={`dont-${i}`}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-medium text-slate-500">핵심 1개 액션</p>
                <p className="mt-1 font-medium text-slate-900">{checklist.core_single_action}</p>
              </div>
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
                아직 액션 플랜을 생성할 분석 결과가 없습니다.
              </p>
              <p className="text-sm text-slate-600">
                채널 분석을 먼저 실행하면, 우선순위 액션을 자동으로 정리해 드립니다.
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
                YouTube 채널을 등록하면, TubeWatch가 데이터를 기반으로 성장 액션을
                제안합니다.
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

