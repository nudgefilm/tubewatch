import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/config/admin";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";

/** Closed Alpha: 관리자 최대 채널 등록 수 */
export const ADMIN_CHANNEL_LIMIT = 20;
const NORMAL_CHANNEL_LIMIT = 3;

export function isAdminUser(email?: string | null): boolean {
  return isAdmin(email);
}

export function getChannelLimit(email?: string | null): number {
  return isAdmin(email) ? ADMIN_CHANNEL_LIMIT : NORMAL_CHANNEL_LIMIT;
}

/**
 * Admin이면 999, 아니면 구독 기반 channelLimit.
 * API·UI 동일 소스 사용 시 이 함수 사용.
 */
export async function getUserChannelLimit(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<number> {
  if (isAdmin(email)) {
    return ADMIN_CHANNEL_LIMIT;
  }
  const limits = await getEffectiveLimits(supabase, userId);
  return limits.channelLimit;
}

export function canBypassCooldown(email?: string | null): boolean {
  return isAdmin(email);
}
