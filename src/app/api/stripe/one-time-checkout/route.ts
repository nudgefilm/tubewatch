/**
 * POST /api/stripe/one-time-checkout
 * Single Pass / Triple Pack 단건 크레딧 Stripe Checkout 세션 생성.
 * 클라이언트에서 { productId: "single" | "triple" } 전송.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import {
  CREDIT_PRODUCTS,
  CREDIT_PRICE_ID_ENV_KEYS,
  type CreditProductId,
} from "@/components/billing/types";

const VALID_PRODUCT_IDS: CreditProductId[] = ["single", "triple"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const productId = typeof raw.productId === "string" ? raw.productId.trim() : "";
  if (!VALID_PRODUCT_IDS.includes(productId as CreditProductId)) {
    return NextResponse.json({ error: "유효하지 않은 상품입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const product = CREDIT_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 400 });
  }

  const priceIdEnvKey = CREDIT_PRICE_ID_ENV_KEYS[productId as CreditProductId];
  const priceId = process.env[priceIdEnvKey];
  if (!priceId) {
    console.error(`[one-time-checkout] missing env: ${priceIdEnvKey}`);
    return NextResponse.json({ error: "결제 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        product_type: "credit",
        user_id: user.id,
        credit_count: String(product.creditCount),
      },
      success_url: `${baseUrl}/billing?checkout=success&product=${productId}`,
      cancel_url: `${baseUrl}/billing?checkout=cancel`,
      customer_email: user.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[one-time-checkout] stripe error:", msg);
    return NextResponse.json({ error: "결제 세션 생성에 실패했습니다." }, { status: 502 });
  }
}
