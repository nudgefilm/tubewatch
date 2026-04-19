import BillingView from "@/components/billing/BillingView";
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";
import { createClient } from "@/lib/supabase/server";
import { getUserBillingStatus } from "@/lib/server/billing/getUserBillingStatus";

// 결제 완료 후 router.refresh() 시 항상 최신 DB 상태를 반환하도록 캐시 비활성화
export const dynamic = "force-dynamic";

export default async function BillingRoutePage() {
  const userId = await redirectToLandingAuthUnlessSignedIn("/billing");
  const supabase = await createClient();
  const [billingStatus, { count }] = await Promise.all([
    getUserBillingStatus(supabase, userId),
    supabase.from("user_channels").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return <BillingView initialData={billingStatus} channelCount={count ?? 0} />;
}
