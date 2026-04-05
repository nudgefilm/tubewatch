/**
 * POST /api/admin/set-user-plan
 * 특정 유저의 구독 플랜을 어드민이 수동으로 설정.
 * - "creator" | "pro" → user_subscriptions upsert (status: active, stripe ID: manual)
 * - "free" → user_subscriptions row 삭제
 * Admin 전용 — profiles.role = 'admin' 체크.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { BILLING_PLANS } from "@/components/billing/types";

const VALID_PLAN_IDS = ["creator", "pro", "free"] as const;
type PlanId = typeof VALID_PLAN_IDS[number];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const isAdmin = await isAdminUser(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const targetUserId = typeof raw.userId === "string" ? raw.userId.trim() : "";
  const planId = typeof raw.planId === "string" ? raw.planId.trim() as PlanId : "";

  if (!targetUserId) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }
  if (!VALID_PLAN_IDS.includes(planId as PlanId)) {
    return NextResponse.json({ error: "planId는 creator | pro | free 중 하나여야 합니다." }, { status: 400 });
  }

  if (planId === "free") {
    // free로 설정 = 구독 row 삭제
    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .delete()
      .eq("user_id", targetUserId);

    if (error) {
      console.error("[set-user-plan] delete error:", error.message);
      return NextResponse.json({ error: "플랜 초기화에 실패했습니다." }, { status: 500 });
    }
    console.log(`[set-user-plan] set free (deleted subscription) for user=${targetUserId} by admin=${user.id}`);
    return NextResponse.json({ ok: true, planId: "free" });
  }

  // creator / pro → upsert
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json({ error: "알 수 없는 플랜입니다." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const manualSubId = `manual_admin_${targetUserId}_${planId}`;

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert({
      user_id: targetUserId,
      stripe_customer_id: null,
      stripe_subscription_id: manualSubId,
      plan_id: planId,
      subscription_status: "active",
      current_period_end: oneYearLater,
      updated_at: now,
    }, { onConflict: "user_id" });

  if (error) {
    console.error("[set-user-plan] upsert error:", error.message);
    return NextResponse.json({ error: "플랜 설정에 실패했습니다." }, { status: 500 });
  }

  console.log(`[set-user-plan] set ${planId} for user=${targetUserId} by admin=${user.id}`);
  return NextResponse.json({ ok: true, planId });
}
