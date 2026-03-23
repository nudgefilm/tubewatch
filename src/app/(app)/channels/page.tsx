import ChannelsPageClient from "@/components/channels/ChannelsPageClient";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

export default async function ChannelsPage() {
  await redirectToLandingAuthUnlessSignedIn("/channels");
  return <ChannelsPageClient />;
}
