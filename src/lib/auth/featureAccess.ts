import { createClient } from "@/lib/supabase/server";
import { fetchProfileYoutubeVerification } from "@/lib/auth/loadProfileYoutubeVerification";
import { persistProfileYoutubeVerificationAfterCheck } from "@/lib/auth/persistProfileYoutubeVerification";
import { deniedYoutubeFeatureAccessSnapshot } from "@/lib/auth/youtubeFeatureAccessShared";
import type {
  ProfileYoutubeVerificationFields,
  VerifyManagedYoutubeChannelsResult,
  YoutubeFeatureAccessSnapshot,
  YoutubeVerificationUiState,
} from "@/lib/auth/youtubeVerificationTypes";
import { verifyManagedYoutubeChannels } from "@/lib/youtube/verifyManagedChannels";

export {
  deniedYoutubeFeatureAccessSnapshot,
  fallbackYoutubeVerificationUiForOptionalVm,
} from "@/lib/auth/youtubeFeatureAccessShared";

function deriveYoutubeVerificationUiState(args: {
  profile: ProfileYoutubeVerificationFields | null;
  live: VerifyManagedYoutubeChannelsResult | null;
  hasProviderToken: boolean;
}): YoutubeVerificationUiState {
  const live = args.live;

  if (!args.hasProviderToken) {
    return {
      variant: "unverified",
      badgeLabel: "YouTube 토큰 없음",
      message:
        "관리 가능한 YouTube 채널 확인 후 이용 가능합니다.",
      detail:
        "Google 로그인 세션에 YouTube Data API용 액세스 토큰이 없습니다. YouTube 읽기 권한이 포함된 Google 로그인으로 다시 연결해 주세요. (필요 scope: youtube.readonly 등)",
    };
  }

  if (!live) {
    return {
      variant: "pending",
      badgeLabel: "확인 전",
      message: "YouTube 채널 확인 진행 전입니다.",
      detail: null,
    };
  }

  if (live.status === "revoked") {
    return {
      variant: "revoked",
      badgeLabel: "권한 만료·거절",
      message: "채널 관리 권한을 다시 확인해야 합니다.",
      detail:
        live.errorMessage != null
          ? `YouTube API 응답: ${live.errorMessage}`
          : null,
    };
  }

  if (live.status === "verified") {
    return {
      variant: "verified",
      badgeLabel: "YouTube 확인됨",
      message: `관리 가능한 채널 ${live.managedChannels.length}개가 확인되었습니다.`,
      detail:
        "핵심 분석·메뉴별 실행은 이 확인을 통과한 세션에서만 진행할 수 있습니다.",
    };
  }

  if (live.status === "unverified") {
    return {
      variant: "unverified",
      badgeLabel: "관리 채널 없음",
      message:
        "관리 가능한 YouTube 채널 확인 후 이용 가능합니다.",
      detail:
        "Google 계정에 연결된 YouTube 채널이 없거나, `channels.list?mine=true` 결과가 비어 있습니다.",
    };
  }

  if (args.profile?.youtubeVerificationStatus === "pending") {
    return {
      variant: "pending",
      badgeLabel: "확인 보류",
      message: "YouTube 채널 확인 진행 전입니다.",
      detail:
        live.errorMessage != null
          ? `마지막 시도: ${live.errorMessage}`
          : null,
    };
  }

  return {
    variant: "unverified",
    badgeLabel: "확인 실패",
    message:
      "관리 가능한 YouTube 채널 확인 후 이용 가능합니다.",
    detail:
      live.errorMessage != null
        ? `오류: ${live.errorMessage}`
        : "YouTube API 호출에 실패했습니다.",
  };
}

/**
 * 현재 세션 기준 YouTube 관리 채널 검증 + UI 스냅샷.
 * - `provider_token` 이 있으면 `channels.list?mine=true` 를 실제 호출한다.
 * - 성공/실패 요약은 `profiles` 캐시 컬럼에 best-effort 로 저장한다(마이그레이션·RLS 필요).
 */
export async function buildYoutubeFeatureAccessSnapshot(): Promise<YoutubeFeatureAccessSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return deniedYoutubeFeatureAccessSnapshot("로그인되지 않았습니다.");
  }

  const profile = await fetchProfileYoutubeVerification(supabase, user.id);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const providerToken =
    session?.provider_token != null &&
    typeof session.provider_token === "string"
      ? session.provider_token
      : null;

  const hasProviderToken =
    providerToken != null && providerToken.trim() !== "";

  if (!hasProviderToken) {
    return {
      canUseCoreAnalysisFeatures: false,
      profile,
      liveCheck: null,
      ui: deriveYoutubeVerificationUiState({
        profile,
        live: null,
        hasProviderToken: false,
      }),
    };
  }

  const live = await verifyManagedYoutubeChannels({
    providerAccessToken: providerToken,
  });

  await persistProfileYoutubeVerificationAfterCheck(supabase, user.id, live);

  const canUse =
    live.status === "verified" && live.managedChannels.length > 0;

  return {
    canUseCoreAnalysisFeatures: canUse,
    profile,
    liveCheck: live,
    ui: deriveYoutubeVerificationUiState({
      profile,
      live,
      hasProviderToken: true,
    }),
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
