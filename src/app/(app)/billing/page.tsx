import BillingView from "@/components/billing/BillingView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";
import { createClient } from "@/lib/supabase/server";
import { getUserBillingStatus } from "@/lib/server/billing/getUserBillingStatus";

export default async function BillingRoutePage() {
  const userId = await redirectToLandingAuthUnlessSignedIn("/billing");
  const supabase = await createClient();
  const billingStatus = await getUserBillingStatus(supabase, userId);
  return <BillingView initialData={billingStatus} />;
}
