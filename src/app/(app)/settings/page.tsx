import SettingsView from "@/components/settings/SettingsView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ChannelRow = {
  id: string;
  channel_title: string | null;
  channel_url: string | null;
  channel_id: string | null;
  thumbnail_url: string | null;
};

export default async function SettingsRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/settings");

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email ?? null;
  const meta = session?.user?.user_metadata ?? {};
  const displayName =
    (meta.name as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.preferred_username as string | undefined) ||
    email ||
    null;
  const avatarUrl = (meta.avatar_url as string | undefined) ?? null;

  // 구독 플랜 조회
  let planId: string | null = null;
  if (session?.user?.id) {
    const { data: subData } = await supabaseAdmin
      .from("user_subscriptions")
      .select("plan_id, status")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();
    const validStatuses = ["active", "trialing", "manual", "refunded"];
    const subStatus = typeof (subData as { status?: string } | null)?.status === "string"
      ? ((subData as { status?: string }).status ?? "").trim().toLowerCase()
      : "";
    if (subData?.plan_id && validStatuses.includes(subStatus)) {
      const base = (subData.plan_id as string).replace("_6m", "");
      planId = base === "creator" || base === "pro" ? base : null;
    }
  }

  const { data: channelsData } = await supabase
    .from("user_channels")
    .select("id, channel_title, channel_url, channel_id, thumbnail_url")
    .order("created_at", { ascending: true });

  const channels: ChannelRow[] = Array.isArray(channelsData) ? channelsData : [];

  return (
    <SettingsView
      email={email}
      displayName={displayName}
      avatarUrl={avatarUrl}
      planId={planId}
      channels={channels}
    />
  );
}
