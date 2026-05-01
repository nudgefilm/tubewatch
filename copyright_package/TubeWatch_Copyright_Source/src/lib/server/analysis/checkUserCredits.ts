import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/config/admin";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";

export type UserCreditsRow = {
  id: string;
  user_id: string;
  credits_used: number;
  period_start: string;
  period_end: string;
  lifetime_analyses_used: number;
  purchased_credits: number;
};

export class UserCreditsExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserCreditsExhaustedError";
  }
}

function getMonthStartUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01T00:00:00.000Z`;
}

function getNextMonthStartUtc(date: Date): string {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 19) + ".000Z";
}

const CREDITS_SELECT =
  "id, user_id, credits_used, period_start, period_end, lifetime_analyses_used, purchased_credits";

/**
 * 현재 시점 기준 사용자의 크레딧 row를 조회하고, 없거나 기간이 지났으면 생성/갱신 후 반환.
 */
export async function getOrCreateUserCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<UserCreditsRow> {
  const now = new Date();
  const periodStart = getMonthStartUtc(now);
  const periodEnd = getNextMonthStartUtc(now);

  const { data: existing, error: selectError } = await supabase
    .from("user_credits")
    .select(CREDITS_SELECT)
    .eq("user_id", userId)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`user_credits select failed: ${selectError.message}`);
  }

  if (!existing) {
    const { data: inserted, error: insertError } = await supabase
      .from("user_credits")
      .insert({
        user_id: userId,
        credits_used: 0,
        period_start: periodStart,
        period_end: periodEnd,
        lifetime_analyses_used: 0,
        purchased_credits: 0,
      })
      .select(CREDITS_SELECT)
      .single();

    if (insertError) {
      throw new Error(`user_credits insert failed: ${insertError.message}`);
    }

    return inserted as unknown as UserCreditsRow;
  }

  const row = existing as unknown as UserCreditsRow;
  const periodEndDate = new Date(row.period_end);

  // 월 기간 만료: credits_used 리셋 (lifetime_analyses_used·purchased_credits 유지)
  if (periodEndDate.getTime() <= now.getTime()) {
    const { data: updated, error: updateError } = await supabase
      .from("user_credits")
      .update({ credits_used: 0, period_start: periodStart, period_end: periodEnd })
      .eq("id", row.id)
      .select(CREDITS_SELECT)
      .single();

    if (updateError) {
      throw new Error(`user_credits period update failed: ${updateError.message}`);
    }

    return updated as unknown as UserCreditsRow;
  }

  return row;
}

/**
 * 분석 요청 전 호출. 크레딧이 없으면 UserCreditsExhaustedError throw.
 * - Free 플랜: lifetime_analyses_used < (FREE_LIFETIME_ANALYSIS_LIMIT + purchased_credits)
 * - 유료 플랜: credits_used < monthlyAnalysisLimit (월별 리셋)
 * - Admin: 제한 없음
 */
export async function assertUserHasCredit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<void> {
  if (isAdmin(userEmail)) return;

  const [credits, limits] = await Promise.all([
    getOrCreateUserCredits(supabase, userId),
    getEffectiveLimits(supabase, userId),
  ]);

  if (limits.planId === "free") {
    const effectiveLimit = FREE_LIFETIME_ANALYSIS_LIMIT + credits.purchased_credits;
    if (credits.lifetime_analyses_used >= effectiveLimit) {
      throw new UserCreditsExhaustedError(
        "무료 분석 횟수를 모두 사용했습니다. 구독 플랜이나 단건 크레딧을 이용해주세요."
      );
    }
  } else {
    if (credits.credits_used >= limits.monthlyAnalysisLimit) {
      throw new UserCreditsExhaustedError(
        "이번 달 분석 크레딧을 모두 사용했습니다."
      );
    }
  }
}

/**
 * 성공적인 분석 완료 시 호출.
 * - Free 플랜: lifetime_analyses_used + 1
 * - 유료 플랜: credits_used + 1
 */
export async function incrementCreditsUsed(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const [credits, limits] = await Promise.all([
    getOrCreateUserCredits(supabase, userId),
    getEffectiveLimits(supabase, userId),
  ]);

  if (limits.planId === "free") {
    const { error } = await supabase
      .from("user_credits")
      .update({ lifetime_analyses_used: credits.lifetime_analyses_used + 1 })
      .eq("id", credits.id);
    if (error) throw new Error(`user_credits lifetime increment failed: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("user_credits")
      .update({ credits_used: credits.credits_used + 1 })
      .eq("id", credits.id);
    if (error) throw new Error(`user_credits increment failed: ${error.message}`);
  }
}

/**
 * 단건 크레딧 구매 완료 시 호출 (webhook에서 supabaseAdmin으로 실행).
 * purchased_credits에 count를 추가.
 */
export async function addPurchasedCredits(
  supabase: SupabaseClient,
  userId: string,
  count: number
): Promise<void> {
  const now = new Date();
  const periodStart = getMonthStartUtc(now);
  const periodEnd = getNextMonthStartUtc(now);

  const { data: existing } = await supabase
    .from("user_credits")
    .select("id, purchased_credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("user_credits").insert({
      user_id: userId,
      credits_used: 0,
      period_start: periodStart,
      period_end: periodEnd,
      lifetime_analyses_used: 0,
      purchased_credits: count,
    });
  } else {
    const row = existing as { id: string; purchased_credits: number };
    await supabase
      .from("user_credits")
      .update({ purchased_credits: row.purchased_credits + count })
      .eq("id", row.id);
  }
}
