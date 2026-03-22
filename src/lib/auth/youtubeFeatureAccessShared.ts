import type {
  YoutubeFeatureAccessSnapshot,
  YoutubeVerificationUiState,
} from "@/lib/auth/youtubeVerificationTypes";

/** 서버/클라이언트 공통 — `featureAccess.ts`(server import)에 의존하지 않음 */
export function deniedYoutubeFeatureAccessSnapshot(
  reason: string
): YoutubeFeatureAccessSnapshot {
  return {
    canUseCoreAnalysisFeatures: false,
    profile: null,
    liveCheck: null,
    ui: {
      variant: "unverified",
      badgeLabel: "YouTube 미연결",
      message: "관리 가능한 YouTube 채널 확인 후 이용 가능합니다.",
      detail: reason,
    },
  };
}

/** `BenchmarkPage` 등 뷰모델이 없을 때 UI 폴백(클라이언트에서 안전하게 import) */
export function fallbackYoutubeVerificationUiForOptionalVm(): YoutubeVerificationUiState {
  return deniedYoutubeFeatureAccessSnapshot("뷰모델이 전달되지 않았습니다.").ui;
}
