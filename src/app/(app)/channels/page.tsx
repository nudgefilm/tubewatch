import ChannelsPageClient from "@/components/channels/ChannelsPageClient";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config/admin";
import { ADMIN_CHANNEL_LIMIT } from "@/lib/admin/adminTools";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";

export default async function ChannelsPage() {
  const userId = await redirectToLandingAuthUnlessSignedIn("/channels");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  const adminUser = isAdmin(email);
  const maxCount = adminUser
    ? ADMIN_CHANNEL_LIMIT
    : (await getEffectiveLimits(supabase, userId)).channelLimit;

  return <ChannelsPageClient isAdmin={adminUser} maxCount={maxCount} />;
}
