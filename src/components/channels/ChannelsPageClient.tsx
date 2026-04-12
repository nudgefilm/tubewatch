"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RegisterChannelForm from "@/components/channels/RegisterChannelForm";
import {
  readSelectedChannelIdFromStorage,
  writeSelectedChannelIdToStorage,
} from "@/lib/channels/selectedChannelStorage";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";
import { OverloadRetryBanner } from "@/components/features/shared/OverloadRetryBanner";
import { AnalysisProgressBar } from "@/components/features/shared/AnalysisProgressBar";
import { AnalysisWaitingCard } from "@/components/channels/AnalysisWaitingCard";

type ChannelRow = {
  id: string;
  channel_title: string | null;
  channel_url: string | null;
  channel_id: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  created_at?: string | null;
  last_analyzed_at?: string | null;
};

const COOLDOWN_MS = 12 * 60 * 60 * 1000 // 12시간

function formatCooldownRemain(lastAnalyzedAt: string): string {
  const elapsed = Date.now() - new Date(lastAnalyzedAt).getTime()
  const remain = Math.max(0, COOLDOWN_MS - elapsed)
  if (remain <= 0) return ""
  const h = Math.floor(remain / 3600000)
  const m = Math.floor((remain % 3600000) / 60000)
  if (h > 0) return `${h}시간 ${m}분 후 재분석 가능`
  return `${m}분 후 재분석 가능`
}

function broadcastChannelsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("tubewatch-channels-updated"));
}

export default function ChannelsPageClient({
  isAdmin = false,
  maxCount = 3,
  staleChannelIds = [],
}: {
  isAdmin?: boolean;
  maxCount?: number;
  staleChannelIds?: string[];
}): JSX.Element {
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [overloadQueued, setOverloadQueued] = useState(false);
  const [overloadRetryAfterSec, setOverloadRetryAfterSec] = useState(90);
  // localStorage 기반 쿨다운 캐시 (라우터 캐시 무관하게 복원)
  const [cooldownCache, setCooldownCache] = useState<Record<string, string>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // localStorage에서 선택 채널 초기화 + 사이드바 변경 이벤트 동기화
  useEffect(() => {
    setSelectedChannelId(readSelectedChannelIdFromStorage());
    // 저장된 쿨다운 캐시 복원
    try {
      const raw = localStorage.getItem("tw-cd-cache");
      if (raw) setCooldownCache(JSON.parse(raw) as Record<string, string>);
    } catch { /* ignore */ }
    const handler = () => setSelectedChannelId(readSelectedChannelIdFromStorage());
    window.addEventListener("tubewatch-channels-updated", handler);
    return () => window.removeEventListener("tubewatch-channels-updated", handler);
  }, []);

  // 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const selectChannel = useCallback((id: string) => {
    writeSelectedChannelIdToStorage(id);
    setSelectedChannelId(id);
    broadcastChannelsUpdated();
  }, []);

  const loadChannels = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/channels", { credentials: "include", cache: "no-store" });
      const json: { ok?: boolean; data?: ChannelRow[]; error?: string } =
        await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[Channels/load] /api/channels GET failed:", res.status, json.error);
        setListError(json.error || "목록을 불러오지 못했습니다.");
        setChannels([]);
        return;
      }
      const loaded = Array.isArray(json.data) ? json.data : [];
      console.log("[Channels/load] loaded channels:", loaded.length, loaded.map(c => ({ id: c.id, title: c.channel_title, last_analyzed_at: c.last_analyzed_at })));
      setChannels(loaded);
    } catch (e) {
      console.error("[Channels/load] fetch exception:", e);
      setListError("목록을 불러오지 못했습니다.");
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  // 페이지가 다시 보일 때 최신 채널 데이터 재조회 (라우터 캐시 우회)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") void loadChannels();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loadChannels]);

  // 삭제된 채널이 선택 중이면 선택 해제
  useEffect(() => {
    if (!selectedChannelId || loading) return;
    if (!channels.find((ch) => ch.id === selectedChannelId)) {
      writeSelectedChannelIdToStorage(null);
      setSelectedChannelId(null);
    }
  }, [channels, selectedChannelId, loading]);

  const handleDelete = async (row: ChannelRow) => {
    const name = row.channel_title ?? row.channel_id ?? "채널";
    if (
      !window.confirm(
        `"${name}"을(를) 삭제할까요?\n\n⚠️ 이 채널의 분석 데이터가 함께 삭제됩니다.`
      )
    ) {
      return;
    }
    setDeletingId(row.id);
    setListError(null);
    try {
      const res = await fetch("/api/channels", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: row.id }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(json.error || "삭제에 실패했습니다.");
        return;
      }
      if (selectedChannelId === row.id) {
        writeSelectedChannelIdToStorage(null);
        setSelectedChannelId(null);
      }
      broadcastChannelsUpdated();
      await loadChannels();
    } catch {
      setListError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const selectedChannel =
    channels.find((ch) => ch.id === selectedChannelId) ?? null;

  // 쿨다운 체크 — last_analyzed_at (DB) || localStorage 캐시 중 유효한 쪽 사용 (admin bypass)
  const cooldownSource = selectedChannel
    ? (selectedChannel.last_analyzed_at ?? cooldownCache[selectedChannel.id] ?? null)
    : null
  const cooldownRemain = !isAdmin && cooldownSource
    ? formatCooldownRemain(cooldownSource)
    : ""
  const isCooldown = cooldownRemain.length > 0

  // E2E 진단 로그 — 선택 상태 추적
  console.log("[Channels/state] selectedChannelId:", selectedChannelId, "→ selectedChannel:", selectedChannel ? { id: selectedChannel.id, title: selectedChannel.channel_title } : null, "| channels.length:", channels.length);
  console.log("[Channels/cooldown] source:", cooldownSource, "| remain:", cooldownRemain, "| isCooldown:", isCooldown, "| isAdmin:", isAdmin, "| cache:", cooldownCache);

  const handleStartAnalysis = useCallback(() => {
    if (!selectedChannel || !selectedChannel.id || isNavigating) {
      setAnalysisError("선택된 채널 정보를 찾을 수 없습니다. 채널을 다시 선택하세요.");
      return;
    }
    setIsNavigating(true);
    setAnalysisError(null);
    setProgressStep("fetching_yt");
    setOverloadQueued(false);

    const channelId = selectedChannel.id;

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void fetch(`/api/analysis/job-status?channelId=${channelId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d: { job?: { progress_step?: string | null } | null }) => {
          const step = d.job?.progress_step;
          if (step) setProgressStep(step);
        })
        .catch(() => undefined);
    }, 2500);
    console.log("[Analysis Start UI] selectedChannel:", { id: channelId, title: selectedChannel.channel_title });

    const payload = { channelId };
    console.log("[Analysis Start UI] request payload:", payload);

    fetch("/api/analysis/request", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const result = await res.json().catch(() => ({})) as {
          ok?: boolean;
          code?: string;
          error?: string;
          retryAfter?: number;
          analysisResultId?: string;
        };
        console.log("[Analysis Start UI] response:", result);

        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

        if (!res.ok) {
          if (result.code === "COOLDOWN_ACTIVE") {
            setIsNavigating(false);
            setProgressStep(null);
            const dest = `/analysis?channel=${channelId}`;
            console.log("[Analysis Start UI] navigate to:", dest, "(cooldown)");
            router.push(dest);
          } else if (result.code === "CREDITS_EXHAUSTED") {
            setCreditsExhausted(true);
            setAnalysisError(result.error ?? "분석 크레딧이 소진되었습니다.");
            setIsNavigating(false);
            setProgressStep(null);
          } else if (result.code === "OVERLOAD_QUEUED") {
            // 과부하 큐 대기 — 에러 없이 waiting card로 전환
            setIsNavigating(false);
            setProgressStep(null);
            setOverloadRetryAfterSec(result.retryAfter ?? 90);
            setOverloadQueued(true);
            console.log("[Analysis Start UI] overload queued — retryAfter:", result.retryAfter ?? 90, "s");
          } else {
            setAnalysisError(result.error ?? "분석 요청에 실패했습니다.");
            setIsNavigating(false);
            setProgressStep(null);
          }
          return;
        }

        // 분석 완료 시간을 localStorage에 저장 → 페이지 재방문 시 쿨다운 즉시 복원
        try {
          const raw = localStorage.getItem("tw-cd-cache");
          const cache: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
          cache[channelId] = new Date().toISOString();
          localStorage.setItem("tw-cd-cache", JSON.stringify(cache));
          setCooldownCache(cache);
        } catch { /* ignore */ }

        const dest = `/analysis?channel=${channelId}`;
        console.log("[Analysis Start UI] navigate to:", dest);
        router.push(dest);
      })
      .catch((err: unknown) => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        console.error("[Analysis Start UI] fetch error:", err);
        setAnalysisError("네트워크 오류가 발생했습니다. 다시 시도하세요.");
        setIsNavigating(false);
        setProgressStep(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, isNavigating, router]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">내 채널</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록한 채널은 사이드바에서 선택할 수 있습니다. 선택 상태는 이 브라우저에
          저장됩니다.
        </p>
      </div>

      {/* 온보딩 — 채널 없는 신규 유저 안내 */}
      {!loading && channels.length === 0 && !creditsExhausted && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5">
          <p className="text-sm font-semibold text-foreground">TubeWatch에 오신 것을 환영합니다!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            유튜브 채널을 등록하면 AI가 최근 영상 50개를 분석해 채널 현황, 성장 전략, 콘텐츠 DNA를 제공합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-foreground/10 bg-background px-2.5 py-1">
              채널 1개 (Free)
            </span>
            <span className="rounded-full border border-foreground/10 bg-background px-2.5 py-1">
              생애 {FREE_LIFETIME_ANALYSIS_LIMIT}회 분석
            </span>
            <span className="rounded-full border border-foreground/10 bg-background px-2.5 py-1">
              재분석 12시간 쿨다운
            </span>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            더 많은 채널과 분석이 필요하다면{" "}
            <a href="/billing" className="font-semibold text-primary underline hover:opacity-80">
              유료 플랜
            </a>
            을 이용하세요.
          </p>
        </div>
      )}

      <RegisterChannelForm
        currentCount={channels.length}
        maxCount={maxCount}
        isAdmin={isAdmin}
        onRegistered={async (newChannelId) => {
          // localStorage를 먼저 쓴 뒤 broadcast — 사이드바 이벤트 핸들러가 읽을 때 새 ID가 이미 저장되어 있어야 함
          console.log("[Channels/register] onRegistered called. newChannelId:", newChannelId ?? "(none)");
          if (newChannelId) {
            writeSelectedChannelIdToStorage(newChannelId);
          }
          broadcastChannelsUpdated();
          await loadChannels();
          if (newChannelId) {
            setSelectedChannelId(newChannelId);
          }
        }}
      />

      {/* 채널 분석 시작 CTA */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg
              className="size-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold tracking-tight">채널 분석 시작</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              선택한 채널의 현재 상태를 진단하고 후속 전략 메뉴의 기준선을
              만듭니다.
            </p>
            <div className="mt-3 border-t border-border/60 pt-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                최대 50개 영상 · 80가지 이상의 핵심 지표를 정밀 분석합니다.
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">&apos;튜브워치 4개 리포트 통합 요약&apos;</span>은 채널 분석 완료 후 생성이 가능합니다. 채널의 &apos;핵심 인사이트&apos;를 놓치지 마세요.
              </p>
            </div>
            {selectedChannel ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                  {selectedChannel.channel_title ??
                    selectedChannel.channel_id ??
                    "채널"}
                </p>
                {staleChannelIds.includes(selectedChannel.id) && (
                  <p className="text-xs text-amber-600 font-medium">
                    새로운 분석 엔진이 적용되었습니다 — 재분석을 권장합니다.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                아래 목록에서 채널을 선택하거나 채널을 등록하세요.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={!selectedChannel || isNavigating || overloadQueued || creditsExhausted || isCooldown}
            onClick={handleStartAnalysis}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isNavigating ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                분석 중…
              </>
            ) : (
              "채널분석 시작"
            )}
          </button>

          {/* 쿨다운 안내 */}
          {isCooldown && (
            <p className="text-xs text-muted-foreground">
              최근 분석이 완료되었습니다 — {cooldownRemain}.
            </p>
          )}

          <AnalysisProgressBar isActive={isNavigating} />

          {/* 분석 대기 카드 — 진행 중이거나 과부하 큐 대기 중일 때 표시 */}
          {selectedChannel && (isNavigating || overloadQueued) && (
            <AnalysisWaitingCard
              channel={{
                title: selectedChannel.channel_title,
                thumbnailUrl: selectedChannel.thumbnail_url ?? null,
                subscriberCount: selectedChannel.subscriber_count ?? null,
                videoCount: selectedChannel.video_count ?? null,
              }}
              progressStep={progressStep}
              isOverloadQueued={overloadQueued}
              retryAfterSec={overloadRetryAfterSec}
              onRetry={handleStartAnalysis}
            />
          )}

          {analysisError && !creditsExhausted && !overloadQueued && (
            <OverloadRetryBanner message={analysisError} isRequesting={isNavigating} onRetry={handleStartAnalysis} />
          )}
          {creditsExhausted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-amber-800">
                {analysisError ?? "분석 횟수를 모두 사용했습니다."}
              </p>
              <p className="text-xs text-amber-700">
                다음 달 리셋까지 기다리거나, 플랜을 업그레이드하세요.
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <a
                  href="/billing"
                  className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  플랜 업그레이드
                </a>
                <a
                  href="/billing?period=semiannual"
                  className="inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  6개월 플랜 보기 (15% 할인)
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 등록된 채널 목록 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">등록된 채널</h2>
          {channels.length > 0 && (
            <span className="text-[11px] text-muted-foreground/60">
              최대 {maxCount}개 등록 · 월 {maxCount * 2}회 교체 가능
            </span>
          )}
        </div>
        {channels.length > 0 && (
          <p className="mb-2 text-[11px] text-muted-foreground/50">
            채널 삭제 시 해당 채널의 분석 데이터가 함께 삭제되며 복구되지 않습니다.
          </p>
        )}
        {loading ? (
          <ul className="divide-y rounded-xl border border-border bg-card">
            {[1, 2].map((i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-56 animate-pulse rounded bg-muted/60" />
                </div>
                <div className="h-7 w-12 animate-pulse rounded-lg bg-muted" />
              </li>
            ))}
          </ul>
        ) : listError ? (
          <p className="text-sm text-red-600">{listError}</p>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            등록된 채널이 없습니다.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border border-border bg-card">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => selectChannel(ch.id)}
                >
                  <p className="flex flex-wrap items-center gap-2 truncate font-medium text-foreground">
                    {ch.channel_title ?? ch.channel_id ?? "채널"}
                    {selectedChannelId === ch.id && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        선택됨
                      </span>
                    )}
                    {staleChannelIds.includes(ch.id) && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        업데이트 권장
                      </span>
                    )}
                  </p>
                  {ch.channel_url ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {ch.channel_url}
                    </p>
                  ) : null}
                </button>
                <button
                  type="button"
                  disabled={deletingId === ch.id}
                  onClick={() => void handleDelete(ch)}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === ch.id ? "삭제 중…" : "삭제"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

