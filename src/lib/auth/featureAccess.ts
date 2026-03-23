import { createClient } from "@/lib/supabase/server";
import { deniedYoutubeFeatureAccessSnapshot } from "@/lib/auth/youtubeFeatureAccessShared";
import type {
  YoutubeFeatureAccessSnapshot,
  YoutubeVerificationUiState,
} from "@/lib/auth/youtubeVerificationTypes";

export {
  deniedYoutubeFeatureAccessSnapshot,
  fallbackYoutubeVerificationUiForOptionalVm,
} from "@/lib/auth/youtubeFeatureAccessShared";

/**
 * 로그인만으로 핵심 분석 기능 사용 가능.
 * YouTube OAuth / 관리 채널 검증은 사용하지 않음 — 채널은 수동 등록.
 */
export async function buildYoutubeFeatureAccessSnapshot(): Promise<YoutubeFeatureAccessSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return deniedYoutubeFeatureAccessSnapshot("로그인되지 않았습니다.");
  }

  return {
    canUseCoreAnalysisFeatures: true,
    profile: null,
    liveCheck: null,
    ui: {
      variant: "verified",
      badgeLabel: "분석 준비",
      message: "등록한 채널에 대해 분석을 실행할 수 있습니다.",
      detail: null,
    },
  };
}

export function canUseCoreAnalysisFeatures(
  snapshot: YoutubeFeatureAccessSnapshot
): boolean {
  return snapshot.canUseCoreAnalysisFeatures;
}

export function getYoutubeVerificationUiState(
  snapshot: YoutubeFeatureAccessSnapshot
): YoutubeVerificationUiState {
  return snapshot.ui;
}
