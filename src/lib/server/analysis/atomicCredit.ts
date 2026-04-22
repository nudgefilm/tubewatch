/**
 * Atomic Credit: reserve / confirm / rollback
 *
 * Master Plan v1.2 § 5 Business Layer
 *
 * reserve() — 분석 시작 전. Supabase RPC로 credits 잠금 + 선점을 원자적으로 처리.
 * confirm() — 분석 성공 후. reservation → 'confirmed'.
 * rollback() — 분석 실패 시. reservation → 'released' + 크레딧 복구.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";
import { getOrCreateUserCredits } from "@/lib/server/analysis/checkUserCredits";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";

export class CreditReservationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "CreditReservationError";
  }
}

type ReserveResult = {
  reservationId: string;
  isFreePlan: boolean;
};

/**
 * 크레딧 예약. admin은 호출 금지 — 호출 전에 isAdmin 체크 필수.
 * 반환: { reservationId, isFreePlan } — confirm/rollback에 전달해야 한다.
 */
export async function reserveCredit(
  userId: string,
  channelId: string
): Promise<ReserveResult> {
  const [limits, credits] = await Promise.all([
    getEffectiveLimits(supabaseAdmin, userId),
    getOrCreateUserCredits(supabaseAdmin, userId),
  ]);

  const isFreePlan = limits.planId === "free";
  const effectiveLimit = isFreePlan
    ? FREE_LIFETIME_ANALYSIS_LIMIT + credits.purchased_credits
    : limits.monthlyAnalysisLimit;

  const { data, error } = await supabaseAdmin.rpc("reserve_credit", {
    p_user_id: userId,
    p_channel_id: channelId,
    p_is_free_plan: isFreePlan,
    p_effective_limit: effectiveLimit,
  });

  if (error) {
    throw new CreditReservationError(
      `reserve_credit RPC failed: ${error.message}`,
      "RPC_ERROR"
    );
  }

  const result = data as { ok: boolean; code?: string; error?: string; reservation_id?: string };

  if (!result.ok) {
    throw new CreditReservationError(
      result.error ?? "크레딧 예약에 실패했습니다.",
      result.code ?? "UNKNOWN"
    );
  }

  if (!result.reservation_id) {
    throw new CreditReservationError("reservation_id를 받지 못했습니다.", "RPC_ERROR");
  }

  return { reservationId: result.reservation_id, isFreePlan };
}

/**
 * 분석 성공 후 호출. non-fatal — 실패해도 분석 결과는 유지.
 */
export async function confirmCredit(
  reservationId: string,
  snapshotId: string | null
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("confirm_credit", {
    p_reservation_id: reservationId,
    p_snapshot_id: snapshotId ?? null,
  });
  if (error) {
    console.error("[AtomicCredit] confirm failed (non-fatal):", error.message);
  }
}

/**
 * 분석 실패 시 호출. non-fatal — 실패해도 로그 기록 후 계속.
 */
export async function rollbackCredit(
  reservationId: string,
  isFreePlan: boolean
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("rollback_credit", {
    p_reservation_id: reservationId,
    p_is_free_plan: isFreePlan,
  });
  if (error) {
    console.error("[AtomicCredit] rollback failed (non-fatal):", error.message);
  }
}
