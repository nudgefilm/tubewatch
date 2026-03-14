import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config/admin";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";
import type { EffectivePlanId } from "@/lib/server/subscription/getEffectiveLimits";

export const dynamic = "force-dynamic";

type SubscriptionCheckResponse = {
  userId: string;
  planId: EffectivePlanId;
  subscriptionStatus: string | null;
  channelLimit: number;
  monthlyAnalysisLimit: number;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }

    const limits = await getEffectiveLimits(supabase, user.id);

    const body: SubscriptionCheckResponse = {
      userId: user.id,
      planId: limits.planId,
      subscriptionStatus: limits.subscriptionStatus,
      channelLimit: limits.channelLimit,
      monthlyAnalysisLimit: limits.monthlyAnalysisLimit,
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
