import SupportView from "@/components/support/SupportView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

export default async function SupportRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/support");
  return <SupportView />;
}
