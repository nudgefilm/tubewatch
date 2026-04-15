/**
 * POST /api/portone/payment-complete
 * PortOne 결제 완료 후 서버에서 검증 + DB 반영.
 *
 * Body:
 *   { type: "subscription", paymentId: string, planId: BillingPlanId }
 *   { type: "credit",       paymentId: string, productId: CreditProductId }
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
  type CreditProductId,
} from "@/components/billing/types";

const VALID_PLAN_IDS: BillingPlanId[] = ["creator", "pro", "creator_6m", "pro_6m"];
const VALID_PRODUCT_IDS: CreditProductId[] = ["single", "triple"];

const PLAN_PERIOD_MONTHS: Record<BillingPlanId, number> = {
  creator: 1,
  pro: 1,
  creator_6m: 6,
  pro_6m: 6,
};

function getPlanKrwPrice(planId: BillingPlanId): number {
  const base = BILLING_PLANS.find(
    (p) => p.id === planId || p.semiannualPlanId === planId
  );
  if (!base) throw new Error(`알 수 없는 플랜: ${planId}`);
  const isSemiannual = planId === "creator_6m" || planId === "pro_6m";
  return isSemiannual ? base.semiannualPriceKrw : base.priceKrw;
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

  // ─── 구독: idempotency 체크 ───────────────────────────────────────────────
  // 동일 paymentId + payment_status = 'paid' 이면 이미 처리된 결제 → 즉시 반환

  if (type === "subscription") {
    const { data: existingSub } = await supabaseAdmin
      .from("user_subscriptions")
      .select("payment_status, portone_payment_id")
      .eq("user_id", user.id)
      .maybeSingle();

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
    if (!VALID_PLAN_IDS.includes(planId as BillingPlanId)) {
      return NextResponse.json({ error: "유효하지 않은 플랜입니다." }, { status: 400 });
    }
    const planIdTyped = planId as BillingPlanId;

    let expectedKrw: number;
    try {
      expectedKrw = getPlanKrwPrice(planIdTyped);
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
    const months = PLAN_PERIOD_MONTHS[planIdTyped];
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const expiresAtIso = expiresAt.toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_id: planIdTyped,
          subscription_status: "active",
          payment_status: "paid",
          renewal_at: expiresAtIso,
          portone_payment_id: paymentId,
          grant_type: "portone",
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    if (upsertError) {
      console.error("[portone/payment-complete] upsert error:", upsertError);
      return NextResponse.json({ error: "구독 정보 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, planId: planIdTyped });
  }

  // ─── 단건 크레딧 처리 ─────────────────────────────────────────────────────

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
    return NextResponse.json({ ok: true, credits: product.creditCount });
  } catch (e) {
    console.error("[portone/payment-complete] addPurchasedCredits error:", e);
    return NextResponse.json({ error: "크레딧 지급에 실패했습니다." }, { status: 500 });
  }
}
