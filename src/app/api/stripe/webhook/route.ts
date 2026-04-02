/**
 * POST /api/stripe/webhook
 * Stripe 웹훅 수신 및 이벤트 라우팅.
 *
 * 처리 이벤트:
 * - checkout.session.completed (product_type=subscription → 구독 활성화)
 * - checkout.session.completed (product_type=credit      → 단건 크레딧 충전)
 * - customer.subscription.updated                        → 구독 상태 갱신
 * - customer.subscription.deleted                        → 구독 취소 처리
 *
 * 환경변수: STRIPE_WEBHOOK_SECRET
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import {
  handleSubscriptionCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "@/lib/server/stripe/handleSubscriptionWebhook";
import { handleOneTimePurchaseCompleted } from "@/lib/server/stripe/handleOneTimePurchaseWebhook";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  if (!WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[webhook] signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  console.log(`[webhook] received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const productType = session.metadata?.product_type;

        if (productType === "subscription") {
          const result = await handleSubscriptionCheckoutCompleted(session);
          if (!result.ok) console.error("[webhook] subscription checkout error:", result.error);
        } else if (productType === "credit") {
          const result = await handleOneTimePurchaseCompleted(session);
          if (!result.ok) console.error("[webhook] credit purchase error:", result.error);
        } else {
          console.warn("[webhook] unknown product_type:", productType);
        }
        break;
      }

      case "customer.subscription.updated": {
        const result = await handleSubscriptionUpdated(event.data.object);
        if (!result.ok) console.error("[webhook] subscription updated error:", result.error);
        break;
      }

      case "customer.subscription.deleted": {
        const result = await handleSubscriptionDeleted(event.data.object);
        if (!result.ok) console.error("[webhook] subscription deleted error:", result.error);
        break;
      }

      default:
        console.log(`[webhook] unhandled event type: ${event.type}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[webhook] handler error:", msg);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
