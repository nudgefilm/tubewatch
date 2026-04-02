/**
 * POST /api/stripe/subscription-checkout
 * Creator / Pro 구독 Stripe Checkout 세션 생성.
 * 클라이언트에서 { planId: "creator" | "pro" } 전송.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import {
  BILLING_PLANS,
  SUBSCRIPTION_PRICE_ID_ENV_KEYS,
  type BillingPlanId,
} from "@/components/billing/types";

const VALID_PLAN_IDS: BillingPlanId[] = ["creator", "pro"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const planId = typeof raw.planId === "string" ? raw.planId.trim() : "";
  if (!VALID_PLAN_IDS.includes(planId as BillingPlanId)) {
    return NextResponse.json({ error: "유효하지 않은 플랜입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json({ error: "플랜을 찾을 수 없습니다." }, { status: 400 });
  }

  const priceIdEnvKey = SUBSCRIPTION_PRICE_ID_ENV_KEYS[planId as BillingPlanId];
  const priceId = process.env[priceIdEnvKey];
  if (!priceId) {
    console.error(`[subscription-checkout] missing env: ${priceIdEnvKey}`);
    return NextResponse.json({ error: "결제 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        product_type: "subscription",
        user_id: user.id,
        plan_id: planId,
      },
      success_url: `${baseUrl}/billing?checkout=success&plan=${planId}`,
      cancel_url: `${baseUrl}/billing?checkout=cancel`,
      customer_email: user.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[subscription-checkout] stripe error:", msg);
    return NextResponse.json({ error: "결제 세션 생성에 실패했습니다." }, { status: 502 });
  }
}
