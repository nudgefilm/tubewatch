import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { generateGuestFullReport } from "@/lib/server/guest/generateGuestFullReport";
import {
  handleSubscriptionCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "@/lib/server/stripe/handleSubscriptionWebhook";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request): Promise<NextResponse> {
  if (!STRIPE_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json(
      { message: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { message: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json(
      { message: "Failed to read body" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const productType = metadata.product_type;

    if (productType === "guest_strategy_report") {
      const channelUrl =
        typeof metadata.channel_url === "string" ? metadata.channel_url : "";
      const channelTitle =
        typeof metadata.channel_title === "string"
          ? metadata.channel_title
          : "";
      const sessionId = session.id ?? "";
      if (!sessionId) {
        return NextResponse.json(
          { message: "Missing session id" },
          { status: 400 }
        );
      }
      try {
        const result = await generateGuestFullReport(
          sessionId,
          channelUrl,
          channelTitle
        );
        if (!result.ok) {
          console.error(
            "[stripe.webhook] generateGuestFullReport failed",
            result.error
          );
          return NextResponse.json(
            { message: result.error },
            { status: 500 }
          );
        }
        return NextResponse.json({
          received: true,
          reportId: result.reportId,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Report generation failed";
        console.error("[stripe.webhook] error", err);
        return NextResponse.json({ message }, { status: 500 });
      }
    }

    if (productType === "subscription") {
      try {
        const result = await handleSubscriptionCheckoutCompleted(session);
        if (!result.ok) {
          console.error(
            "[stripe.webhook] handleSubscriptionCheckoutCompleted failed",
            result.error
          );
          return NextResponse.json(
            { message: result.error },
            { status: 500 }
          );
        }
        return NextResponse.json({ received: true });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Subscription checkout handling failed";
        console.error("[stripe.webhook] subscription error", err);
        return NextResponse.json({ message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    try {
      const result = await handleSubscriptionUpdated(subscription);
      if (!result.ok) {
        console.error(
          "[stripe.webhook] handleSubscriptionUpdated failed",
          result.error
        );
        return NextResponse.json(
          { message: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ received: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Subscription updated handling failed";
      console.error("[stripe.webhook] subscription.updated error", err);
      return NextResponse.json({ message }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    try {
      const result = await handleSubscriptionDeleted(subscription);
      if (!result.ok) {
        console.error(
          "[stripe.webhook] handleSubscriptionDeleted failed",
          result.error
        );
        return NextResponse.json(
          { message: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ received: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Subscription deleted handling failed";
      console.error("[stripe.webhook] subscription.deleted error", err);
      return NextResponse.json({ message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
