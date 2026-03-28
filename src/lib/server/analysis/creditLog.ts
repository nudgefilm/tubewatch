import type { SupabaseClient } from "@supabase/supabase-js";

export type CreditLogParams = {
  userId: string;
  channelId: string;
  snapshotId: string | null;
  analysisRunId: string | null;
  runType: "full" | "partial";
  requestedModules: readonly string[];
  creditBefore: number;
  /** 음수 = 차감(분석 소비), 양수 = 환불/복구. */
  creditDelta: number;
  resultStatus: "requested" | "applied" | "failed";
  failureReason?: string | null;
  idempotencyKey?: string | null;
};

/**
 * credit_logs에 run 단위 1행 기록.
 * 비치명적(non-fatal) — 삽입 실패 시 콘솔 오류만 출력하고 throw하지 않는다.
 * 분석 run 흐름을 차단하지 않기 위함.
 */
export async function insertCreditLog(
  supabase: SupabaseClient,
  params: CreditLogParams
): Promise<void> {
  const { error } = await supabase.from("credit_logs").insert({
    user_id: params.userId,
    channel_id: params.channelId,
    snapshot_id: params.snapshotId,
    analysis_run_id: params.analysisRunId,
    run_type: params.runType,
    requested_modules: params.requestedModules as string[],
    credit_before: params.creditBefore,
    credit_delta: params.creditDelta,
    result_status: params.resultStatus,
    failure_reason: params.failureReason ?? null,
    idempotency_key: params.idempotencyKey ?? null,
  });

  if (error) {
    console.error("[insertCreditLog] failed:", error.message, {
      analysisRunId: params.analysisRunId,
      resultStatus: params.resultStatus,
    });
  }
}
