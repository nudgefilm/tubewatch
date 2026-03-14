import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/v0-import/components/landing/navigation";
import { FooterSection } from "@/v0-import/components/landing/footer-section";
import { PricingPlanCard } from "@/components/billing/PricingPlanCard";
import { BILLING_PLANS } from "@/components/billing/types";
import SectionCard from "@/components/ui/SectionCard";
import {
  getEffectiveLimits,
  type EffectivePlanId,
} from "@/lib/server/subscription/getEffectiveLimits";
import { isAdmin } from "@/lib/config/admin";

function planDisplayLabel(planId: EffectivePlanId, isAdminUser: boolean): string {
  if (isAdminUser) return "관리자 계정";
  if (planId === "free") return "Free";
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  return plan?.name ?? planId;
}

export default async function BillingPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let planLabel = "Free";
  let statusLabel: string | null = null;
  let channelLimit: number | null = null;
  let monthlyAnalysisLimit: number | null = null;

  if (user) {
    const limits = await getEffectiveLimits(supabase, user.id);
    const isAdminUser = isAdmin(user.email);
    planLabel = planDisplayLabel(limits.planId, isAdminUser);
    statusLabel =
      typeof limits.subscriptionStatus === "string" &&
      limits.subscriptionStatus.trim() !== ""
        ? limits.subscriptionStatus
        : null;
    if (!isAdminUser) {
      channelLimit = limits.channelLimit;
      monthlyAnalysisLimit = limits.monthlyAnalysisLimit;
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-2xl font-bold text-gray-900">
            요금제
          </h1>

          <SectionCard className="mt-4">
            <p className="text-sm font-medium text-gray-900">현재 플랜</p>
            {!user ? (
              <p className="mt-1 text-sm text-gray-500">
                로그인하면 현재 플랜을 확인할 수 있습니다.
              </p>
            ) : (
              <>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {planLabel}
                </p>
                {statusLabel ? (
                  <p className="mt-0.5 text-xs text-gray-500">
                    상태: {statusLabel}
                  </p>
                ) : null}
                {channelLimit !== null && monthlyAnalysisLimit !== null ? (
                  <p className="mt-1 text-xs text-gray-500">
                    채널 {channelLimit}개 · 월 분석 {monthlyAnalysisLimit}회
                  </p>
                ) : null}
              </>
            )}
          </SectionCard>

          <SectionCard className="mt-4 border-primary/20 bg-primary/5">
            <p className="text-sm text-gray-600">
              이미 단건 리포트를 구매하셨습니다.
            </p>
            <p className="mt-1 text-sm text-gray-600">
              지속 분석이 필요하면 구독 플랜이 더 유리합니다.
            </p>
          </SectionCard>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {BILLING_PLANS.map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:underline"
            >
              홈으로
            </Link>
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
