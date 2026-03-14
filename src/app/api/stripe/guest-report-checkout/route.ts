import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";

const STRIPE_GUEST_REPORT_PRICE_ID = process.env.STRIPE_GUEST_REPORT_PRICE_ID;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type PostBody = {
  channelUrl?: string;
  channelTitle?: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!STRIPE_GUEST_REPORT_PRICE_ID?.trim()) {
      return NextResponse.json(
        { message: "Stripe price is not configured." },
        { status: 500 }
      );
    }
    if (!NEXT_PUBLIC_APP_URL?.trim()) {
      return NextResponse.json(
        { message: "App URL is not configured." },
        { status: 500 }
      );
    }

    let body: PostBody;
    try {
      body = (await req.json()) as PostBody;
    } catch {
      body = {};
    }

    const channelUrl = typeof body.channelUrl === "string" ? body.channelUrl : "";
    const channelTitle =
      typeof body.channelTitle === "string" ? body.channelTitle : "";

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: STRIPE_GUEST_REPORT_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${NEXT_PUBLIC_APP_URL}/checkout/success`,
      cancel_url: `${NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        product_type: "guest_strategy_report",
        channel_url: channelUrl,
        channel_title: channelTitle,
      },
    });

    const url = session.url ?? null;
    if (!url) {
      return NextResponse.json(
        { message: "Checkout session URL is missing." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Checkout session creation failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
