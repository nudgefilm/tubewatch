import SettingsView from "@/components/settings/SettingsView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

export default async function SettingsRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/settings");
  return <SettingsView />;
}
