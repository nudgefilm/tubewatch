import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  VerifyManagedYoutubeChannelsResult,
  YoutubeVerificationProfileStatus,
} from "@/lib/auth/youtubeVerificationTypes";

function mapLiveToDbStatus(
  live: VerifyManagedYoutubeChannelsResult
): YoutubeVerificationProfileStatus {
  switch (live.status) {
    case "verified":
      return "verified";
    case "unverified":
      return "unverified";
    case "revoked":
      return "revoked";
    case "error":
      return "pending";
    default: {
      const _e: never = live.status;
      return _e;
    }
  }
}

/**
 * 검증 시도 후 profiles 캐시 갱신. RLS/스키마 미적용 시 조용히 실패해도 UI 가드는 live 결과로 동작한다.
 */
export async function persistProfileYoutubeVerificationAfterCheck(
  supabase: SupabaseClient,
  userId: string,
  live: VerifyManagedYoutubeChannelsResult
): Promise<void> {
  const status = mapLiveToDbStatus(live);
  const lastCheck = live.checkedAt;
  const verifiedAt = live.status === "verified" ? live.checkedAt : null;
  const count =
    live.status === "verified"
      ? live.managedChannels.length
      : live.status === "unverified" || live.status === "revoked"
        ? 0
        : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      youtube_verification_status: status,
      youtube_verified_at: verifiedAt,
      last_youtube_check_at: lastCheck,
      verified_channel_count: count,
      updated_at: lastCheck,
    })
    .eq("id", userId);

  if (error) {
    console.warn(
      "[persistProfileYoutubeVerificationAfterCheck] skipped:",
      error.message
    );
  }
}
