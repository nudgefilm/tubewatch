import SettingsPage from "@/v0-tubewatchui/app/(app)/settings/page";

import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

export default async function SettingsRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/settings");
  return <SettingsPage />;
}
