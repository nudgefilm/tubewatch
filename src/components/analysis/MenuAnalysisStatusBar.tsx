"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisStatus } from "@/lib/analysis/types";
import {
  isExtensionMenuExecuteEnabled,
  type MenuExtensionAnalysisRunType,
} from "@/lib/analysis/analysisRun";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import type {
  YoutubeVerificationUiState,
  YoutubeVerificationUiVariant,
} from "@/lib/auth/youtubeVerificationTypes";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function readApiErrorMessage(body: unknown): string {
  if (!isRecord(body)) {
    return "요청에 실패했습니다.";
  }
  const err = body.error;
  if (typeof err === "string" && err.trim() !== "") {
    return err;
  }
  return "요청에 실패했습니다.";
}

function youtubeVerificationBadgeClassName(
  variant: YoutubeVerificationUiVariant
): string {
  switch (variant) {
    case "verified":
      return "border-emerald-500/45 text-emerald-900 dark:text-emerald-200";
    case "pending":
      return "border-amber-500/55 text-amber-950 dark:text-amber-200";
    case "revoked":
      return "border-red-500/55 text-red-900 dark:text-red-200";
    case "unverified":
      return "border-amber-600/50 text-amber-950 dark:text-amber-100";
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

export type MenuAnalysisStatusBarVariant =
  | "analysis"
  | "action_plan"
  | "channel_dna"
  | "next_trend";

function formatLastRun(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeLabel(status: AnalysisStatus): string {
  switch (status) {
    case "not_started":
      return "미시작";
    case "ready_from_base":
      return "베이스 준비됨";
    case "needs_refresh":
      return "갱신 필요";
    case "queued":
      return "대기 중";
    case "running":
      return "실행 중";
    case "completed":
      return "완료";
    case "failed":
      return "실패";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function variantTitle(variant: MenuAnalysisStatusBarVariant): string {
  switch (variant) {
    case "analysis":
      return "베이스 분석 상태";
    case "action_plan":
      return "액션 플랜 분석 실행";
    case "channel_dna":
      return "Channel DNA 분석 실행";
    case "next_trend":
      return "Next Trend 확장 실행";
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

function dataBasisLines(
  variant: MenuAnalysisStatusBarVariant,
  status: AnalysisStatus,
  hasChannel: boolean
): { primary: string; secondary: string } {
  if (!hasChannel) {
    return {
      primary: "채널이 선택되지 않았습니다. 연결·선택 후 상태가 갱신됩니다.",
      secondary: "이 메뉴의 확장 분석은 채널 컨텍스트가 있어야 실행할 수 있습니다.",
    };
  }

  switch (status) {
    case "not_started":
      return {
        primary:
          variant === "analysis"
            ? "저장된 베이스 분석이 없습니다. 분석을 실행하면 이 페이지의 지표가 채워집니다."
            : "베이스 분석 결과가 없어 이 메뉴 전용 데이터를 준비할 수 없습니다. 먼저 /analysis에서 베이스 분석을 완료하세요.",
        secondary: "화면에 보이는 안내는 현재 서버에 없는 상태를 반영합니다.",
      };
    case "ready_from_base":
      return {
        primary:
          "현재 표시는 저장된 베이스(analysis_results) 데이터를 기준으로 합니다. 이 메뉴 전용 추가 수집·파생 결과는 아직 없을 수 있습니다.",
        secondary:
          "메뉴별 확장 분석을 실행하면 이후 이 상태가 ‘완료’ 등으로 바뀌며, 별도 run 이력이 쌓이게 됩니다(저장소 연동 후).",
      };
    case "needs_refresh":
      return {
        primary:
          "베이스 데이터와 비교해 이 메뉴 결과를 다시 맞출 필요가 있습니다. 갱신 실행을 권장합니다.",
        secondary:
          "판정은 `shouldMarkNeedsRefresh`에서 조정됩니다(베이스 스냅샷 대비 + 추후 TTL·업로드·영상 수 등).",
      };
    case "queued":
      return {
        primary:
          "분석 run이 큐에 등록되어 워커/실행기 할당을 기다리는 상태입니다.",
        secondary: "곧 실행 중으로 바뀌거나, 대기가 길어지면 인프라·큐 상태를 확인하세요.",
      };
    case "running":
      return {
        primary: "이 메뉴에 대한 분석이 현재 실행 중입니다.",
        secondary: "완료되면 ‘완료’ 상태와 기준 시각이 갱신됩니다.",
      };
    case "completed":
      return {
        primary:
          "이 메뉴에 대한 마지막 실행이 완료된 것으로 표시됩니다. 아래 시각은 기준 데이터 시점입니다.",
        secondary: "베이스 분석만 갱신된 경우에도 확장 메뉴는 별도 실행이 필요할 수 있습니다.",
      };
    case "failed":
      return {
        primary: "마지막 실행이 실패한 것으로 표시됩니다. 다시 시도할 수 있습니다.",
        secondary: "오류 상세는 저장소·로그 연동 후 이 영역에 노출할 수 있습니다.",
      };
    default: {
      const _exhaustive: never = status;
      return { primary: _exhaustive, secondary: "" };
    }
  }
}

function executeButtonLabel(status: AnalysisStatus): string {
  switch (status) {
    case "queued":
      return "대기 중...";
    case "running":
      return "분석 중...";
    case "completed":
    case "failed":
      return "다시 분석";
    case "not_started":
    case "ready_from_base":
    case "needs_refresh":
      return "분석 실행";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type MenuAnalysisStatusBarProps = {
  variant: MenuAnalysisStatusBarVariant;
  menuStatus: AnalysisStatus;
  lastRunAt: string | null;
  hasChannel: boolean;
  /** `channels.list?mine=true` 등으로 관리 채널이 확인된 경우에만 메뉴별 실행 허용 */
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
  /** `false`이면 analysis_runs 목록이 아직 확정되지 않음(`null`). */
  analysisRunsLoaded?: boolean;
  /** 베이스(analysis) 메뉴는 실행 버튼 없이 안내만 */
  showExecuteButton?: boolean;
  /** 확장 메뉴 실행 시 POST /api/analysis-run 에 전달 */
  executeTarget?: {
    channelId: string;
    analysisType: MenuExtensionAnalysisRunType;
  } | null;
};

export function MenuAnalysisStatusBar({
  variant,
  menuStatus,
  lastRunAt,
  hasChannel,
  coreAnalysisFeaturesEnabled,
  youtubeVerificationUi,
  analysisRunsLoaded = true,
  showExecuteButton = false,
  executeTarget = null,
}: MenuAnalysisStatusBarProps) {
  const router = useRouter();
  const [clickNotice, setClickNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lines = dataBasisLines(variant, menuStatus, hasChannel);
  const executeEnabled = isExtensionMenuExecuteEnabled(hasChannel, menuStatus);
  const disabled = showExecuteButton
    ? !executeEnabled ||
        !coreAnalysisFeaturesEnabled ||
        isSubmitting
    : true;

  const onExecuteClick = useCallback(async () => {
    if (!coreAnalysisFeaturesEnabled) {
      setClickNotice(youtubeVerificationUi.message);
      return;
    }
    if (menuStatus === "queued" || menuStatus === "running") {
      return;
    }
    if (!executeTarget?.channelId || !executeTarget.analysisType) {
      setClickNotice("실행할 채널 정보가 없습니다.");
      return;
    }
    setIsSubmitting(true);
    setClickNotice(null);
    try {
      const res = await fetch("/api/analysis-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: executeTarget.channelId,
          analysisType: executeTarget.analysisType,
        }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setClickNotice(readApiErrorMessage(body));
        return;
      }
      if (!isRecord(body) || body.ok !== true) {
        setClickNotice(readApiErrorMessage(body));
        return;
      }
      router.refresh();
    } catch {
      setClickNotice("네트워크 오류로 실행을 완료하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    coreAnalysisFeaturesEnabled,
    executeTarget?.analysisType,
    executeTarget?.channelId,
    menuStatus,
    router,
    youtubeVerificationUi.message,
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-6 space-y-3">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="flex flex-wrap items-center gap-2">
          {variantTitle(variant)}
          <Badge variant="secondary" className="font-normal">
            {statusBadgeLabel(menuStatus)}
          </Badge>
        </AlertTitle>
        <AlertDescription className="space-y-2 text-sm whitespace-pre-wrap">
          <p>{lines.primary}</p>
          <p className="text-muted-foreground">{lines.secondary}</p>
          <p className="text-muted-foreground">
            데이터 기준 시각:{" "}
            <span className="font-medium text-foreground">
              {formatLastRun(lastRunAt)}
            </span>
          </p>
          {hasChannel && !analysisRunsLoaded && (
            <p className="text-xs text-amber-800 dark:text-amber-300">
              실행 이력(analysis_runs) 목록을 불러오지 못했습니다. 잠시 후 새로고침하거나
              연결 상태를 확인해 주세요.
            </p>
          )}
          <div className="border-t border-border pt-3 mt-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                YouTube 채널 검증
              </span>
              <Badge
                variant="outline"
                className={`font-normal ${youtubeVerificationBadgeClassName(
                  youtubeVerificationUi.variant
                )}`}
              >
                {youtubeVerificationUi.badgeLabel}
              </Badge>
            </div>
            <p
              className={
                youtubeVerificationUi.variant === "verified"
                  ? "text-xs text-muted-foreground"
                  : "text-xs text-amber-900 dark:text-amber-200"
              }
            >
              {youtubeVerificationUi.message}
            </p>
            {youtubeVerificationUi.detail != null &&
              youtubeVerificationUi.detail.trim() !== "" && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {youtubeVerificationUi.detail}
                </p>
              )}
          </div>
          {showExecuteButton && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  void onExecuteClick();
                }}
              >
                {isSubmitting ? "요청 중…" : executeButtonLabel(menuStatus)}
              </Button>
              {menuStatus === "not_started" && hasChannel && variant !== "analysis" && (
                <span className="text-xs text-muted-foreground">
                  베이스 분석이 있어야 활성화됩니다.
                </span>
              )}
              {showExecuteButton &&
                hasChannel &&
                executeEnabled &&
                !coreAnalysisFeaturesEnabled && (
                  <span className="text-xs text-amber-800 dark:text-amber-300">
                    관리 가능한 YouTube 채널 확인 후 메뉴별 실행을 이용할 수 있습니다.
                  </span>
                )}
            </div>
          )}
          {clickNotice && (
            <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
              {clickNotice}
            </p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
