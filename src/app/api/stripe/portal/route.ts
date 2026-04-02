import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const stripeCustomerId =
    (sub as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "Stripe 고객 정보가 없습니다. 구독 후 이용해 주세요." },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
