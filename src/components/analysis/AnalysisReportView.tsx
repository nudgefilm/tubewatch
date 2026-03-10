"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SelectedChannel = {
  id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  created_at: string | null;
  last_analysis_requested_at?: string | null;
  last_analyzed_at?: string | null;
};

type AnalysisResult = {
  id: string;
  user_channel_id: string;

  status: string | null;
  sample_video_count: number | null;
  analysis_confidence: string | null;

  channel_summary: string | null;
  content_pattern_summary: string | null;

  content_patterns: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  recommended_topics: string[] | null;
  growth_action_plan: string[] | null;
  target_audience: string[] | null;

  interpretation_mode: string | null;
  sample_size_note: string | null;

  gemini_status: string | null;
  gemini_model: string | null;
  gemini_analyzed_at: string | null;

  created_at: string | null;
};

type AnalysisReportViewProps = {
  selectedChannel: SelectedChannel;
  latestResult: AnalysisResult | null;
};

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

function formatNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeItems(items: string[] | null | undefined) {
  if (!Array.isArray(items)) return [];
  return items.filter((v) => typeof v === "string" && v.trim().length > 0);
}

function getConfidenceLabel(value: string | null | undefined) {
  if (value === "high") return "신뢰도 높음";
  if (value === "medium") return "신뢰도 보통";
  return "신뢰도 낮음";
}

function getConfidenceClassName(value: string | null | undefined) {
  if (value === "high") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function getStatusLabel(
  status: string | null | undefined,
  geminiStatus: string | null | undefined
) {
  if (status === "analyzed" || geminiStatus === "success") {
    return "분석 완료";
  }

  if (status === "failed" || geminiStatus === "failed") {
    return "분석 실패";
  }

  return "분석 진행 중";
}

function getStatusClassName(
  status: string | null | undefined,
  geminiStatus: string | null | undefined
) {
  if (status === "analyzed" || geminiStatus === "success") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "failed" || geminiStatus === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "지금 분석 가능";

  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}분`);

  return `${parts.join(" ")} 후 재분석 가능`;
}

function getCooldownBaseTime(
  selectedChannel: SelectedChannel,
  latestResult: AnalysisResult | null,
  localRequestedAt: string | null
) {
  return (
    localRequestedAt ??
    selectedChannel.last_analysis_requested_at ??
    selectedChannel.last_analyzed_at ??
    latestResult?.gemini_analyzed_at ??
    latestResult?.created_at ??
    null
  );
}

function getCooldownState(
  selectedChannel: SelectedChannel,
  latestResult: AnalysisResult | null,
  localRequestedAt: string | null
) {
  const baseTime = getCooldownBaseTime(
    selectedChannel,
    latestResult,
    localRequestedAt
  );

  if (!baseTime) {
    return {
      isCooldownActive: false,
      remainingText: "지금 분석 가능",
      nextAvailableAtText: "지금",
    };
  }

  const baseDate = new Date(baseTime);

  if (Number.isNaN(baseDate.getTime())) {
    return {
      isCooldownActive: false,
      remainingText: "지금 분석 가능",
      nextAvailableAtText: "지금",
    };
  }

  const nextAvailableAt = new Date(baseDate.getTime() + COOLDOWN_MS);
  const remainingMs = nextAvailableAt.getTime() - Date.now();
  const isCooldownActive = remainingMs > 0;

  return {
    isCooldownActive,
    remainingText: isCooldownActive ? formatRemaining(remainingMs) : "지금 분석 가능",
    nextAvailableAtText: formatDateTime(nextAvailableAt.toISOString()),
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function List({
  items,
  emptyText = "데이터 없음",
}: {
  items: string[] | null;
  emptyText?: string;
}) {
  const safe = normalizeItems(items);

  if (safe.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {safe.map((item, i) => (
        <li
          key={i}
          className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-800"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AnalysisReportView({
  selectedChannel,
  latestResult,
}: AnalysisReportViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [localRequestedAt, setLocalRequestedAt] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);

  const cooldown = useMemo(() => {
    return getCooldownState(selectedChannel, latestResult, localRequestedAt);
  }, [selectedChannel, latestResult, localRequestedAt]);

  if (!latestResult) {
    return (
      <section className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
        아직 분석 결과가 없습니다.
      </section>
    );
  }

  const isAnalyzed =
    latestResult.status === "analyzed" ||
    latestResult.gemini_status === "success";

  const isBackendRunning =
    latestResult.status === "queued" ||
    latestResult.status === "processing" ||
    latestResult.status === "running" ||
    latestResult.gemini_status === "processing";

  const isRequestLocked =
    isSubmitting || isRefreshing || localPending || isBackendRunning || cooldown.isCooldownActive;

  const analyzedAt = formatDateTime(
    latestResult.gemini_analyzed_at ?? latestResult.created_at
  );

  const statusLabel = getStatusLabel(
    latestResult.status,
    latestResult.gemini_status
  );

  const statusClassName = getStatusClassName(
    latestResult.status,
    latestResult.gemini_status
  );

  const confidenceLabel = getConfidenceLabel(latestResult.analysis_confidence);
  const confidenceClassName = getConfidenceClassName(
    latestResult.analysis_confidence
  );

  function getRequestButtonLabel() {
    if (isSubmitting) return "분석 요청 중...";
    if (isRefreshing) return "상태 반영 중...";
    if (localPending) return "분석 요청됨";
    if (isBackendRunning) return "분석 진행 중";
    if (cooldown.isCooldownActive) return "72시간 쿨다운 적용 중";
    if (latestResult?.status === "failed" || latestResult?.gemini_status === "failed") {
      return "다시 분석 요청";
    }
    return "지금 다시 분석";
  }

  async function handleRequestAnalysis() {
    if (isRequestLocked) return;

    try {
      setIsSubmitting(true);
      setRequestError(null);
      setRequestMessage(null);

      const res = await fetch("/api/analysis/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_channel_id: selectedChannel.id,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "분석 요청에 실패했습니다.");
      }

      const nowIso = new Date().toISOString();

      setLocalRequestedAt(nowIso);
      setLocalPending(true);
      setRequestMessage("분석 요청이 접수되었습니다. 결과가 반영되면 최신 리포트로 갱신됩니다.");

      startTransition(() => {
        router.refresh();
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error && typeof error.message === "string"
          ? error.message
          : "분석 요청에 실패했습니다.";
      setRequestError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            {selectedChannel.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedChannel.thumbnail_url}
                alt={selectedChannel.channel_title ?? "channel"}
                className="h-16 w-16 rounded-full border border-black/5 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-base font-semibold text-gray-500">
                {(selectedChannel.channel_title ?? "C")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-500">채널 리포트</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                {selectedChannel.channel_title ?? "채널명 없음"}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                구독자 {formatNumber(selectedChannel.subscriber_count)}명
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  statusClassName,
                ].join(" ")}
              >
                {statusLabel}
              </span>

              <span
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  confidenceClassName,
                ].join(" ")}
              >
                {confidenceLabel}
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-2 lg:items-end">
              <button
                type="button"
                onClick={handleRequestAnalysis}
                disabled={isRequestLocked}
                className={[
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                  isRequestLocked
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-gray-900 text-white hover:bg-gray-800",
                ].join(" ")}
              >
                {getRequestButtonLabel()}
              </button>

              <div className="min-h-[20px] text-sm">
                {requestError ? (
                  <p className="text-red-600">{requestError}</p>
                ) : requestMessage ? (
                  <p className="text-emerald-600">{requestMessage}</p>
                ) : cooldown.isCooldownActive ? (
                  <p className="text-amber-700">
                    {cooldown.remainingText} · 다음 가능 시각 {cooldown.nextAvailableAtText}
                  </p>
                ) : isBackendRunning ? (
                  <p className="text-gray-600">현재 분석이 진행 중입니다.</p>
                ) : (
                  <p className="text-gray-500">새 분석을 요청하면 최신 데이터로 다시 리포트를 생성합니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">최근 분석 시각</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {analyzedAt}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">분석 영상 수</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(latestResult.sample_video_count)}개
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">분석 모델</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {latestResult.gemini_model ?? "-"}
            </p>
          </div>
        </div>

        {latestResult.sample_size_note ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            {latestResult.sample_size_note}
          </div>
        ) : null}
      </section>

      {!isAnalyzed ? (
        <section className="rounded-2xl border bg-white p-6 text-sm text-gray-700 shadow-sm">
          분석 진행 중입니다.
        </section>
      ) : (
        <>
          <Section title="채널 요약">
            <p className="text-sm leading-7 text-gray-800">
              {latestResult.channel_summary ?? "요약 없음"}
            </p>
          </Section>

          <Section
            title="콘텐츠 패턴"
            description={
              latestResult.content_pattern_summary ??
              "반복적으로 보이는 콘텐츠 흐름입니다."
            }
          >
            <List items={latestResult.content_patterns} />
          </Section>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="강점">
              <List items={latestResult.strengths} />
            </Section>

            <Section title="약점">
              <List items={latestResult.weaknesses} />
            </Section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="병목 요인">
              <List items={latestResult.bottlenecks} />
            </Section>

            <Section title="타겟 시청자">
              <List items={latestResult.target_audience} />
            </Section>
          </div>

          <Section title="추천 콘텐츠">
            <List items={latestResult.recommended_topics} />
          </Section>

          <Section title="성장 액션 플랜">
            <List items={latestResult.growth_action_plan} />
          </Section>
        </>
      )}
    </div>
  );
}