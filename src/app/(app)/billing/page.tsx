import BillingPage from "@/v0-tubewatchui/app/(app)/billing/page";

import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

export default async function BillingRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/billing");
  return <BillingPage />;
}
