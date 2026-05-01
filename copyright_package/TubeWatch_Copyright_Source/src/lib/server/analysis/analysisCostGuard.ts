import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/config/admin";
import { ACTIVE_QUEUE_STATUSES } from "./status";

const COOLDOWN_HOURS = 24;
const USER_DAILY_LIMIT = 5;
const SYSTEM_DAILY_LIMIT = 200;
const QUEUE_ACTIVE_LIMIT = 20;

export class AnalysisCostGuardError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AnalysisCostGuardError";
  }
}

export type AnalysisCostGuardContext = {
  userId: string;
  userEmail: string | null | undefined;
  lastAnalysisRequestedAt: string | null | undefined;
};

function getTodayStartUtc(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

function isWithinCooldown(lastRequestedAt: string | null | undefined): boolean {
  if (!lastRequestedAt) return false;
  const last = new Date(lastRequestedAt);
  if (Number.isNaN(last.getTime())) return false;
  const now = new Date();
  const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  return diffHours < COOLDOWN_HOURS;
}

/**
 * 분석 비용 가드. 제한 초과 시 AnalysisCostGuardError throw.
 * Admin(ADMIN_EMAILS)은 모든 제한 bypass.
 */
export async function assertAnalysisCostGuard(
  supabase: SupabaseClient,
  context: AnalysisCostGuardContext
): Promise<void> {
  const { userEmail, lastAnalysisRequestedAt, userId } = context;

  if (isAdmin(userEmail)) {
    return;
  }

  if (isWithinCooldown(lastAnalysisRequestedAt)) {
    throw new AnalysisCostGuardError(
      "현재 쿨다운이 적용 중입니다. 약 24시간 후 다시 요청할 수 있습니다.",
      "COOLDOWN_ACTIVE"
    );
  }

  const todayStart = getTodayStartUtc();

  const { count: userTodayCount, error: userCountError } = await supabase
    .from("analysis_results")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart);

  if (userCountError) {
    throw new Error(
      `analysis_results user daily count failed: ${userCountError.message}`
    );
  }

  if ((userTodayCount ?? 0) >= USER_DAILY_LIMIT) {
    throw new AnalysisCostGuardError(
      "오늘 분석 요청 한도를 초과했습니다.",
      "USER_DAILY_LIMIT"
    );
  }

  const { count: systemTodayCount, error: systemCountError } = await supabase
    .from("analysis_results")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  if (systemCountError) {
    throw new Error(
      `analysis_results system daily count failed: ${systemCountError.message}`
    );
  }

  if ((systemTodayCount ?? 0) >= SYSTEM_DAILY_LIMIT) {
    throw new AnalysisCostGuardError(
      "현재 분석 요청이 많아 잠시 후 다시 시도해주세요.",
      "SYSTEM_DAILY_LIMIT"
    );
  }

  const { count: queueActiveCount, error: queueCountError } = await supabase
    .from("analysis_queue")
    .select("*", { count: "exact", head: true })
    .in("status", ACTIVE_QUEUE_STATUSES);

  if (queueCountError) {
    throw new Error(
      `analysis_queue active count failed: ${queueCountError.message}`
    );
  }

  if ((queueActiveCount ?? 0) >= QUEUE_ACTIVE_LIMIT) {
    throw new AnalysisCostGuardError(
      "분석 대기열이 많습니다. 잠시 후 다시 시도해주세요.",
      "QUEUE_FULL"
    );
  }
}
