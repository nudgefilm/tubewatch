import SettingsView from "@/components/settings/SettingsView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";
import { createClient } from "@/lib/supabase/server";

type ChannelRow = {
  id: string;
  channel_title: string | null;
  channel_url: string | null;
  channel_id: string | null;
};

export default async function SettingsRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/settings");

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email ?? null;

  const { data: channelsData } = await supabase
    .from("user_channels")
    .select("id, channel_title, channel_url, channel_id")
    .order("created_at", { ascending: true });

  const channels: ChannelRow[] = Array.isArray(channelsData) ? channelsData : [];

  return <SettingsView email={email} channels={channels} />;
}
