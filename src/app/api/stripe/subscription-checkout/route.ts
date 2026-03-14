import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getStripe } from "@/lib/stripe/server";
import {
  type BillingPlanId,
  BILLING_PLANS,
  SUBSCRIPTION_PRICE_ID_ENV_KEYS,
} from "@/components/billing/types";

const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

const VALID_PLAN_IDS: BillingPlanId[] = ["creator", "pro", "agency"];

function isValidPlanId(value: unknown): value is BillingPlanId {
  return (
    typeof value === "string" &&
    VALID_PLAN_IDS.includes(value as BillingPlanId)
  );
}

function createSupabaseServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env not configured");
  }
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!NEXT_PUBLIC_APP_URL?.trim()) {
      return NextResponse.json(
        { error: "App URL is not configured." },
        { status: 500 }
      );
    }

    let body: { planId?: unknown };
    try {
      body = (await req.json()) as { planId?: unknown };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const planIdRaw = body?.planId;
    if (!isValidPlanId(planIdRaw)) {
      return NextResponse.json(
        { error: "planId must be one of: creator, pro, agency." },
        { status: 400 }
      );
    }

    const planId = planIdRaw as BillingPlanId;
    const plan = BILLING_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan." },
        { status: 400 }
      );
    }

    const envKey = SUBSCRIPTION_PRICE_ID_ENV_KEYS[planId];
    const priceId = process.env[envKey];
    if (!priceId || typeof priceId !== "string" || priceId.trim() === "") {
      return NextResponse.json(
        { error: `Stripe subscription price not configured for plan: ${planId}.` },
        { status: 500 }
      );
    }

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail =
      typeof user.email === "string" && user.email.trim() !== ""
        ? user.email.trim()
        : null;

    if (!userEmail) {
      return NextResponse.json(
        { error: "구독 결제를 위해 계정 이메일이 필요합니다." },
        { status: 400 }
      );
    }

    const baseUrl = NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId.trim(),
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing`,
      customer_email: userEmail,
      metadata: {
        product_type: "subscription",
        plan_id: planId,
        user_id: userId,
        user_email: userEmail,
      },
      subscription_data: {
        metadata: {
          product_type: "subscription",
          plan_id: planId,
          user_id: userId,
        },
      },
    });

    const url = session.url ?? null;
    const sessionId = session.id ?? null;

    if (!url) {
      return NextResponse.json(
        { error: "Checkout session URL is missing." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url, sessionId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Subscription checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
