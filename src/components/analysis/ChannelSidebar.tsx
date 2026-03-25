"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";

type ChannelSidebarProps = {
  channels: UserChannelRow[];
  selectedChannelId?: string | null;
  /** v0 히어로 좌측 열의 ScoreGauge 자리(AnalysisReportView에서 주입) */
  gauge: ReactNode;
};

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

function formatSubscriberCount(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "구독자 정보 없음";
  }

  return `구독자 ${value.toLocaleString()}명`;
}

function getChannelBaseTime(channel: UserChannelRow) {
  return (
    channel.last_analysis_requested_at ?? channel.last_analyzed_at ?? null
  );
}

function getChannelStatus(channel: UserChannelRow) {
  const baseTime = getChannelBaseTime(channel);

  if (!baseTime) {
    return {
      label: "분석 가능",
      tone: "ready" as const,
    };
  }

  const baseDate = new Date(baseTime);

  if (Number.isNaN(baseDate.getTime())) {
    return {
      label: "분석 가능",
      tone: "ready" as const,
    };
  }

  const nextAvailableAt = baseDate.getTime() + COOLDOWN_MS;
  const remainingMs = nextAvailableAt - Date.now();

  if (remainingMs > 0) {
    return {
      label: "쿨다운 중",
      tone: "cooldown" as const,
    };
  }

  return {
    label: "분석 가능",
    tone: "ready" as const,
  };
}

function getStatusBadgeClassName(isActive: boolean, tone: "ready" | "cooldown") {
  if (isActive) {
    return tone === "cooldown"
      ? "border-white/20 bg-white/15 text-amber-100"
      : "border-white/20 bg-white/15 text-emerald-100";
  }

  return tone === "cooldown"
    ? "border-amber-200/80 bg-amber-50 text-amber-800"
    : "border-emerald-200/80 bg-emerald-50 text-emerald-800";
}

function getStatusDotClassName(isActive: boolean, tone: "ready" | "cooldown") {
  if (isActive) {
    return tone === "cooldown" ? "bg-amber-200" : "bg-emerald-200";
  }

  return tone === "cooldown" ? "bg-amber-500" : "bg-emerald-500";
}

/**
 * v0 `analysis/page.tsx` 히어로 좌측 열 구조:
 * `flex flex-col items-center lg:items-start` + Badge + 게이지 + 설명 문단.
 * 채널 목록은 동일 열 하단에 배치(데이터 바인딩 유지).
 */
export default function ChannelSidebar({
  channels,
  selectedChannelId,
  gauge,
}: ChannelSidebarProps) {
  return (
    <div className="flex w-full flex-col items-center lg:items-start">
      <Badge variant="outline" className="mb-6">
        Channel Analysis
      </Badge>

      <div className="flex w-full justify-center lg:justify-start">{gauge}</div>

      <p className="mt-6 max-w-md text-center text-muted-foreground lg:text-left">
        원천 데이터 진단형 기준선입니다. TubeWatch 엔진 분석으로 수집·스냅샷된 지표를
        요약합니다.
      </p>

      <nav className="mt-8 w-full max-w-md space-y-2">
        {channels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
            등록된 채널이 없습니다.
          </div>
        ) : (
          channels.map((channel) => {
            const isActive = channel.id === selectedChannelId;

            const href = `/analysis?channel=${encodeURIComponent(channel.id)}`;
            const status = getChannelStatus(channel);

            return (
              <Link
                key={channel.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                prefetch={false}
                className={[
                  "group flex rounded-xl border px-3 py-3 transition-shadow",
                  isActive
                    ? "border-orange-500 bg-orange-500 text-white shadow-md"
                    : "border-border bg-card text-card-foreground hover:bg-muted/50",
                ].join(" ")}
                onClick={(event) => {
                  if (isActive) {
                    event.preventDefault();
                  }
                }}
              >
                <div className="flex w-full items-start gap-3">
                  {channel.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={channel.thumbnail_url}
                      alt={channel.channel_title ?? "채널 썸네일"}
                      className="h-11 w-11 shrink-0 rounded-full border border-black/5 object-cover"
                    />
                  ) : (
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {(channel.channel_title ?? "C").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={[
                          "truncate text-sm font-semibold",
                          isActive ? "text-white" : "text-foreground",
                        ].join(" ")}
                      >
                        {channel.channel_title ?? "채널명 없음"}
                      </p>

                      <span
                        className={[
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          getStatusBadgeClassName(isActive, status.tone),
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            getStatusDotClassName(isActive, status.tone),
                          ].join(" ")}
                        />
                        {status.label}
                      </span>
                    </div>

                    <p
                      className={[
                        "mt-1 text-xs",
                        isActive ? "text-white/80" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {formatSubscriberCount(channel.subscriber_count)}
                    </p>

                    {isActive ? (
                      <p className="mt-2 text-[11px] font-medium opacity-80">
                        현재 보고 있는 채널
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </nav>

      <div className="mt-6 w-full max-w-md">
        <Link
          href="/channels"
          className="flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          채널 관리로 이동
        </Link>
      </div>
    </div>
  );
}
