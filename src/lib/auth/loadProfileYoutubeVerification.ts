import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ProfileYoutubeVerificationFields,
  YoutubeVerificationProfileStatus,
} from "@/lib/auth/youtubeVerificationTypes";

function parseStatus(
  raw: unknown
): YoutubeVerificationProfileStatus | null {
  if (raw === "unverified" || raw === "verified" || raw === "revoked" || raw === "pending") {
    return raw;
  }
  return null;
}

/**
 * `profiles` 에서 YouTube 검증 캐시 컬럼만 조회. 컬럼/행 없음·오류 시 `null`.
 */
export async function fetchProfileYoutubeVerification(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileYoutubeVerificationFields | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "youtube_verification_status, youtube_verified_at, last_youtube_check_at, verified_channel_count"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || typeof data !== "object") {
    return null;
  }

  const row = data as Record<string, unknown>;
  const st = parseStatus(row.youtube_verification_status);
  if (!st) {
    return null;
  }

  const youtubeVerifiedAt =
    typeof row.youtube_verified_at === "string"
      ? row.youtube_verified_at
      : null;
  const lastYoutubeCheckAt =
    typeof row.last_youtube_check_at === "string"
      ? row.last_youtube_check_at
      : null;
  const countRaw = row.verified_channel_count;
  const verifiedChannelCount =
    typeof countRaw === "number" && Number.isFinite(countRaw)
      ? countRaw
      : null;

  return {
    youtubeVerificationStatus: st,
    youtubeVerifiedAt,
    lastYoutubeCheckAt,
    verifiedChannelCount,
  };
}
