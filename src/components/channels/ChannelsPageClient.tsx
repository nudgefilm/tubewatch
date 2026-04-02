"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RegisterChannelForm from "@/components/channels/RegisterChannelForm";
import {
  readSelectedChannelIdFromStorage,
  writeSelectedChannelIdToStorage,
} from "@/lib/channels/selectedChannelStorage";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";

type ChannelRow = {
  id: string;
  channel_title: string | null;
  channel_url: string | null;
  channel_id: string | null;
  created_at?: string | null;
};

function broadcastChannelsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("tubewatch-channels-updated"));
}

export default function ChannelsPageClient({
  isAdmin = false,
  maxCount = 3,
}: {
  isAdmin?: boolean;
  maxCount?: number;
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // localStorage에서 선택 채널 초기화
  useEffect(() => {
    setSelectedChannelId(readSelectedChannelIdFromStorage());
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
      const res = await fetch("/api/channels", { credentials: "include" });
      const json: { ok?: boolean; data?: ChannelRow[]; error?: string } =
        await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[Channels/load] /api/channels GET failed:", res.status, json.error);
        setListError(json.error || "목록을 불러오지 못했습니다.");
        setChannels([]);
        return;
      }
      const loaded = Array.isArray(json.data) ? json.data : [];
      console.log("[Channels/load] loaded channels:", loaded.length, loaded.map(c => ({ id: c.id, title: c.channel_title })));
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

  // 삭제된 채널이 선택 중이면 선택 해제
  useEffect(() => {
    if (!selectedChannelId || loading) return;
    if (!channels.find((ch) => ch.id === selectedChannelId)) {
      writeSelectedChannelIdToStorage(null);
      setSelectedChannelId(null);
    }
  }, [channels, selectedChannelId, loading]);

  const handleDelete = async (row: ChannelRow) => {
    if (
      !window.confirm(
        `"${row.channel_title ?? row.channel_id ?? "채널"}"을(를) 삭제할까요?`
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

  // E2E 진단 로그 — 선택 상태 추적
  console.log("[Channels/state] selectedChannelId:", selectedChannelId, "→ selectedChannel:", selectedChannel ? { id: selectedChannel.id, title: selectedChannel.channel_title } : null, "| channels.length:", channels.length);

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
          // 목록을 먼저 갱신한 뒤 선택 상태를 설정해야 cleanup effect가 신규 채널을 찾을 수 있다.
          // loadChannels 전에 setSelectedChannelId를 하면 채널 목록에 없다고 판단해 null로 초기화되는 race condition 발생.
          console.log("[Channels/register] onRegistered called. newChannelId:", newChannelId ?? "(none)");
          broadcastChannelsUpdated();
          await loadChannels();
          console.log("[Channels/register] loadChannels done. channels.length after:", channels.length);
          if (newChannelId) {
            writeSelectedChannelIdToStorage(newChannelId);
            setSelectedChannelId(newChannelId);
            console.log("[Channels/register] selectedChannelId set to:", newChannelId);
          } else {
            console.warn("[Channels/register] newChannelId is null/undefined — selected channel NOT set");
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
            {selectedChannel ? (
              <p className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                {selectedChannel.channel_title ??
                  selectedChannel.channel_id ??
                  "채널"}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                아래 목록에서 채널을 선택하거나 채널을 등록하세요.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={!selectedChannel || isNavigating || creditsExhausted}
            onClick={() => {
              // 반드시 selectedChannel 객체 기준으로만 판단
              if (!selectedChannel || !selectedChannel.id || isNavigating) {
                setAnalysisError("선택된 채널 정보를 찾을 수 없습니다. 채널을 다시 선택하세요.");
                return;
              }
              setIsNavigating(true);
              setAnalysisError(null);
              setProgressStep("fetching_yt");

              const channelId = selectedChannel.id;

              // 진행 단계 폴링 시작 (2.5초 간격)
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
                    analysisResultId?: string;
                  };
                  console.log("[Analysis Start UI] response:", result);

                  if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

                  if (!res.ok) {
                    if (result.code === "COOLDOWN_ACTIVE") {
                      // 쿨다운 중 → 기존 분석 결과 표시
                      const dest = `/analysis?channel=${channelId}`;
                      console.log("[Analysis Start UI] navigate to:", dest, "(cooldown)");
                      router.push(dest);
                    } else if (result.code === "CREDITS_EXHAUSTED") {
                      setCreditsExhausted(true);
                      setAnalysisError(result.error ?? "분석 크레딧이 소진되었습니다.");
                      setIsNavigating(false);
                      setProgressStep(null);
                    } else {
                      setAnalysisError(result.error ?? "분석 요청에 실패했습니다.");
                      setIsNavigating(false);
                      setProgressStep(null);
                    }
                    return;
                  }

                  // snapshot은 URL에 포함하지 않는 정책 — channel만 전달하면 서버가 latestResult로 렌더
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
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isNavigating ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {progressStep === "fetching_yt" && "유튜브 데이터 수집 중…"}
                {progressStep === "processing_data" && "데이터 처리 중…"}
                {progressStep === "generating_ai" && "AI 분석 중… (30–60초 소요)"}
                {progressStep === "saving_results" && "결과 저장 중…"}
                {(!progressStep || (progressStep !== "fetching_yt" && progressStep !== "processing_data" && progressStep !== "generating_ai" && progressStep !== "saving_results")) && "분석 중…"}
              </>
            ) : (
              "채널분석 시작"
            )}
          </button>
          {analysisError && !creditsExhausted && (
            <p className="text-sm text-red-600">{analysisError}</p>
          )}
          {creditsExhausted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-800">{analysisError}</p>
              <a
                href="/billing"
                className="mt-1 inline-block text-xs font-semibold text-amber-700 underline hover:text-amber-900"
              >
                플랜 업그레이드 →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 등록된 채널 목록 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          등록된 채널
        </h2>
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
