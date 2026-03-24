import BillingView from "@/components/billing/BillingView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

export default async function BillingRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/billing");
  return <BillingView />;
}
