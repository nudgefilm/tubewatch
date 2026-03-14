import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config/admin";

export const dynamic = "force-dynamic";

type CreditsCheckResponse =
  | {
      userId: string;
      monthlyLimit: number;
      creditsUsed: number;
      remainingCredits: number;
      periodStart: string;
      periodEnd: string;
    }
  | { message: string };

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

    const { data: row, error } = await supabase
      .from("user_credits")
      .select("user_id, monthly_limit, credits_used, period_start, period_end")
      .eq("user_id", user.id)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if (!row) {
      const body: CreditsCheckResponse = {
        message: "No credit row yet",
      };
      return NextResponse.json(body);
    }

    const monthlyLimit = Number(row.monthly_limit) ?? 0;
    const creditsUsed = Number(row.credits_used) ?? 0;
    const remainingCredits = Math.max(0, monthlyLimit - creditsUsed);

    const body: CreditsCheckResponse = {
      userId: user.id,
      monthlyLimit,
      creditsUsed,
      remainingCredits,
      periodStart: String(row.period_start ?? ""),
      periodEnd: String(row.period_end ?? ""),
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
