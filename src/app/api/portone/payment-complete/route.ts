/**
 * POST /api/portone/payment-complete
 * PortOne 결제 완료 후 서버에서 검증 + DB 반영.
 *
 * Body:
 *   { type: "subscription", paymentId: string, planId: BillingPlanId, billingPeriod: BillingPeriod }
 *   { type: "credit",       paymentId: string, productId: CreditProductId }
 *
 * 구독 정책:
 *   - 신규/만료 상태: plan_id / billing_period / renewal_at 즉시 적용
 *   - 활성 구독 중 업그레이드(pro >= creator) 또는 기간 변경: 즉시 적용, renewal_at = 기존_renewal_at + 새 기간
 *   - 활성 구독 중 다운그레이드(creator < pro): pending_plan_id / pending_billing_period 예약
 *   - 예약이 이미 존재하면(pending_plan_id != null) → 에러 반환
 *
 * Idempotency:
 *   - 구독: portone_payment_id + payment_status = 'paid' 체크로 중복 처리 방지
 *   - 크레딧: user_credits에 paymentId 추적 컬럼 없음 → 향후 migration 필요 (TODO)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPortOnePayment } from "@/lib/portone/server";
import { addPurchasedCredits } from "@/lib/server/analysis/checkUserCredits";
import {
  BILLING_PLANS,
  CREDIT_PRODUCTS,
  type BillingPlanId,
  type BillingPeriod,
  type CreditProductId,
} from "@/components/billing/types";

type ExistingSubRow = {
  plan_id: string | null;
  subscription_status: string | null;
  payment_status: string | null;
  renewal_at: string | null;
  portone_payment_id: string | null;
  pending_plan_id: string | null;
};

const VALID_PLAN_IDS: BillingPlanId[] = ["creator", "pro"];
const VALID_PERIODS: BillingPeriod[] = ["monthly", "semiannual"];
const VALID_PRODUCT_IDS: CreditProductId[] = ["single", "triple"];

const PERIOD_MONTHS: Record<BillingPeriod, number> = {
  monthly: 1,
  semiannual: 6,
};

const PLAN_RANK: Record<BillingPlanId, number> = {
  creator: 1,
  pro: 2,
};

function getPlanKrwPrice(planId: BillingPlanId, billingPeriod: BillingPeriod): number {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`알 수 없는 플랜: ${planId}`);
  return billingPeriod === "semiannual" ? plan.semiannualPriceKrw : plan.priceKrw;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const type = typeof raw.type === "string" ? raw.type : "";
  const paymentId = typeof raw.paymentId === "string" ? raw.paymentId.trim() : "";

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId가 필요합니다." }, { status: 400 });
  }
  if (type !== "subscription" && type !== "credit") {
    return NextResponse.json({ error: "type은 subscription 또는 credit이어야 합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // ─── 구독: idempotency 체크 + 기존 구독 상태 조회 ────────────────────────────
  // (credit 처리와 분리 — credit 로직에 영향 없음)

  let existingSub: ExistingSubRow | null = null;

  if (type === "subscription") {
    const { data } = await supabaseAdmin
      .from("user_subscriptions")
      .select("payment_status, portone_payment_id, subscription_status, renewal_at, plan_id, pending_plan_id")
      .eq("user_id", user.id)
      .maybeSingle();

    existingSub = data as ExistingSubRow | null;

    if (
      existingSub?.portone_payment_id === paymentId &&
      existingSub?.payment_status === "paid"
    ) {
      console.log("[portone/payment-complete] idempotency: already processed", paymentId);
      return NextResponse.json({ ok: true });
    }
  }

  // ─── PortOne 결제 정보 조회 + 상태 검증 ──────────────────────────────────

  let payment;
  try {
    payment = await getPortOnePayment(paymentId);
  } catch (e) {
    console.error("[portone/payment-complete] getPayment error:", e);
    return NextResponse.json({ error: "결제 확인에 실패했습니다." }, { status: 502 });
  }

  if (payment.status !== "PAID") {
    return NextResponse.json(
      { error: `결제가 완료되지 않았습니다. (상태: ${payment.status})` },
      { status: 400 }
    );
  }

  // ─── 구독 처리 ────────────────────────────────────────────────────────────

  if (type === "subscription") {
    const planId = typeof raw.planId === "string" ? raw.planId.trim() : "";
    const billingPeriod = typeof raw.billingPeriod === "string" ? raw.billingPeriod.trim() : "";

    if (!VALID_PLAN_IDS.includes(planId as BillingPlanId)) {
      return NextResponse.json({ error: "유효하지 않은 플랜입니다." }, { status: 400 });
    }
    if (!VALID_PERIODS.includes(billingPeriod as BillingPeriod)) {
      return NextResponse.json({ error: "유효하지 않은 결제 주기입니다." }, { status: 400 });
    }

    const planIdTyped = planId as BillingPlanId;
    const billingPeriodTyped = billingPeriod as BillingPeriod;

    let expectedKrw: number;
    try {
      expectedKrw = getPlanKrwPrice(planIdTyped, billingPeriodTyped);
    } catch {
      return NextResponse.json({ error: "플랜 가격 조회에 실패했습니다." }, { status: 400 });
    }

    if (payment.amount.total !== expectedKrw) {
      console.error(
        `[portone/payment-complete] subscription amount mismatch: expected=${expectedKrw}, got=${payment.amount.total}`
      );
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
    }

    const now = new Date();

    // ── 현재 구독이 active(renewal_at > now)인지 판단 ────────────────────────
    const isActiveSubscription =
      existingSub?.subscription_status === "active" &&
      !!existingSub.renewal_at &&
      new Date(existingSub.renewal_at).getTime() > now.getTime();

    if (isActiveSubscription) {
      const currentPlanId = (existingSub!.plan_id ?? "") as BillingPlanId;
      const currentRank = PLAN_RANK[currentPlanId] ?? 0;
      const targetRank = PLAN_RANK[planIdTyped];
      const isUpgradeOrSamePlan = targetRank >= currentRank;

      if (isUpgradeOrSamePlan) {
        // ── 업그레이드 또는 기간 변경 → 즉시 적용, renewal_at = 오늘 + 새 기간 ─
        // 기존 잔여 기간은 소멸. CS를 통해 크레딧 보상 신청 가능.
        const months = PERIOD_MONTHS[billingPeriodTyped];
        const newRenewalAt = new Date(now);
        newRenewalAt.setMonth(newRenewalAt.getMonth() + months);

        const { error: updateError } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            plan_id: planIdTyped,
            billing_period: billingPeriodTyped,
            renewal_at: newRenewalAt.toISOString(),
            portone_payment_id: paymentId,
            payment_status: "paid",
            pending_plan_id: null,
            pending_billing_period: null,
            updated_at: now.toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("[portone/payment-complete] upgrade update error:", updateError);
          return NextResponse.json({ error: "구독 변경 저장에 실패했습니다." }, { status: 500 });
        }

        console.log("[portone/payment-complete] immediate upgrade:", planIdTyped, billingPeriodTyped, "for user:", user.id);
        return NextResponse.json({ ok: true, planId: planIdTyped, billingPeriod: billingPeriodTyped, deferred: false });
      } else {
        // ── 다운그레이드 → 만료 후 예약 변경 ────────────────────────────────
        if (existingSub!.pending_plan_id) {
          return NextResponse.json(
            { error: "이미 다음 플랜이 예약되어 있습니다." },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from("user_subscriptions")
          .update({
            pending_plan_id: planIdTyped,
            pending_billing_period: billingPeriodTyped,
            portone_payment_id: paymentId,
            payment_status: "paid",
            updated_at: now.toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("[portone/payment-complete] downgrade pending update error:", updateError);
          return NextResponse.json({ error: "예약 변경 저장에 실패했습니다." }, { status: 500 });
        }

        console.log("[portone/payment-complete] deferred downgrade:", planIdTyped, billingPeriodTyped, "for user:", user.id);
        return NextResponse.json({ ok: true, planId: planIdTyped, billingPeriod: billingPeriodTyped, deferred: true });
      }
    }

    // ── 신규 구독 또는 만료 상태 → 즉시 적용 ────────────────────────────────
    const months = PERIOD_MONTHS[billingPeriodTyped];
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const expiresAtIso = expiresAt.toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_id: planIdTyped,
          billing_period: billingPeriodTyped,
          subscription_status: "active",
          payment_status: "paid",
          renewal_at: expiresAtIso,
          portone_payment_id: paymentId,
          grant_type: "portone",
          pending_plan_id: null,
          pending_billing_period: null,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    if (upsertError) {
      console.error("[portone/payment-complete] upsert error:", upsertError.message);
      return NextResponse.json({ error: "구독 정보 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, planId: planIdTyped, billingPeriod: billingPeriodTyped });
  }

  // ─── 단건 크레딧 처리 ─────────────────────────────────────────────────────
  // (구독 로직과 완전 독립)

  const productId = typeof raw.productId === "string" ? raw.productId.trim() : "";
  if (!VALID_PRODUCT_IDS.includes(productId as CreditProductId)) {
    return NextResponse.json({ error: "유효하지 않은 상품입니다." }, { status: 400 });
  }

  const product = CREDIT_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 400 });
  }

  if (payment.amount.total !== product.priceKrw) {
    console.error(
      `[portone/payment-complete] credit amount mismatch: expected=${product.priceKrw}, got=${payment.amount.total}`
    );
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  try {
    await addPurchasedCredits(supabaseAdmin, user.id, product.creditCount);
  } catch (e) {
    console.error("[portone/payment-complete] addPurchasedCredits error:", e);
    return NextResponse.json({ error: "크레딧 지급에 실패했습니다." }, { status: 500 });
  }

  // user_subscriptions.credits 누적 증가 (구독 여부와 무관하게 독립 처리)
  const { data: subRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select("credits")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentCredits = (subRow?.credits as number | null) ?? 0;

  const { error: creditsUpdateError } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: user.id,
        credits: currentCredits + product.creditCount,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );

  if (creditsUpdateError) {
    console.error("[portone/payment-complete] credits update error:", creditsUpdateError);
    return NextResponse.json({ error: "크레딧 반영에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, credits: product.creditCount });
}
