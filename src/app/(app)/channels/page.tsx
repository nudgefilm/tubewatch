import ChannelsPageClient from "@/components/channels/ChannelsPageClient";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config/admin";
import { ADMIN_CHANNEL_LIMIT } from "@/lib/admin/adminTools";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CURRENT_ENGINE_VERSION } from "@/lib/analysis/engineVersion";

export default async function ChannelsPage() {
  const userId = await redirectToLandingAuthUnlessSignedIn("/channels");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  const adminUser = isAdmin(email);
  const limits = adminUser ? null : await getEffectiveLimits(supabase, userId);
  const maxCount = adminUser ? ADMIN_CHANNEL_LIMIT : limits!.channelLimit;
  const isFreePlan = !adminUser && limits!.planId === "free";

  // 엔진 버전이 낡은 채널 감지 — 최신 analysis_result 기준
  const { data: latestResults } = await supabaseAdmin
    .from("analysis_results")
    .select("user_channel_id, engine_version")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const seenChannels = new Set<string>();
  const staleChannelIds: string[] = [];
  for (const row of (latestResults ?? []) as { user_channel_id: string; engine_version: string | null }[]) {
    if (!row.user_channel_id || seenChannels.has(row.user_channel_id)) continue;
    seenChannels.add(row.user_channel_id);
    if (row.engine_version !== CURRENT_ENGINE_VERSION) {
      staleChannelIds.push(row.user_channel_id);
    }
  }

  return <ChannelsPageClient isAdmin={adminUser} maxCount={maxCount} staleChannelIds={staleChannelIds} isFreePlan={isFreePlan} />;
}
