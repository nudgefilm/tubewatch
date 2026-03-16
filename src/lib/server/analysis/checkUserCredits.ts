import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/config/admin";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";

const FREE_MONTHLY_LIMIT = 5;

export type UserCreditsRow = {
  id: string;
  user_id: string;
  credits_used: number;
  period_start: string;
  period_end: string;
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

/**
 * 현재 시점 기준 사용자의 크레딧 row를 조회하고, 없거나 기간이 지났으면 생성/갱신 후 반환.
 * monthly_limit는 getEffectiveLimits(구독 기반)로 결정하며, 기존 row와 다르면 동기화.
 */
export async function getOrCreateUserCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<UserCreditsRow> {
  const now = new Date();
  const periodStart = getMonthStartUtc(now);
  const periodEnd = getNextMonthStartUtc(now);

  const limits = await getEffectiveLimits(supabase, userId);
  const effectiveLimit = limits.monthlyAnalysisLimit;

  const { data: existing, error: selectError } = await supabase
    .from("user_credits")
    .select("id, user_id, credits_used, period_start, period_end")
    .eq("user_id", userId)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(
      `user_credits select failed: ${selectError.message}`
    );
  }

  if (!existing) {
    const { data: inserted, error: insertError } = await supabase
      .from("user_credits")
      .insert({
        user_id: userId,
        credits_used: 0,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .select("id, user_id, credits_used, period_start, period_end")
      .single();

    if (insertError) {
      throw new Error(
        `user_credits insert failed: ${insertError.message}`
      );
    }

    return inserted as unknown as UserCreditsRow;
  }

  const row = existing as unknown as UserCreditsRow;
  const periodEndDate = new Date(row.period_end);

  if (periodEndDate.getTime() <= now.getTime()) {
    const { data: updated, error: updateError } = await supabase
      .from("user_credits")
      .update({
        credits_used: 0,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .eq("id", row.id)
      .select("id, user_id, credits_used, period_start, period_end")
      .single();

    if (updateError) {
      throw new Error(
        `user_credits period update failed: ${updateError.message}`
      );
    }

    return updated as unknown as UserCreditsRow;
  }

  return row;
}

/**
 * 분석 요청 전 호출. 크레딧이 없으면 UserCreditsExhaustedError throw.
 * Admin은 제한 없음.
 */
export async function assertUserHasCredit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<void> {
  if (isAdmin(userEmail)) {
    return;
  }

  const credits = await getOrCreateUserCredits(supabase, userId);
  const limits = await getEffectiveLimits(supabase, userId);

  if (credits.credits_used >= limits.monthlyAnalysisLimit) {
    throw new UserCreditsExhaustedError(
      "이번 달 분석 크레딧을 모두 사용했습니다."
    );
  }
}

/**
 * 성공적인 분석 완료 시 호출. credits_used + 1.
 */
export async function incrementCreditsUsed(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const credits = await getOrCreateUserCredits(supabase, userId);

  const { error } = await supabase
    .from("user_credits")
    .update({
      credits_used: credits.credits_used + 1,
    })
    .eq("id", credits.id);

  if (error) {
    throw new Error(
      `user_credits increment failed: ${error.message}`
    );
  }
}
