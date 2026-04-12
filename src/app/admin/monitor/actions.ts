"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * 10분 이상 pending 상태로 묶인 모듈 결과를 강제로 failed 처리.
 * 서버 점검 후 무한 pending 상태에서 복구할 때 사용.
 */
export async function resetStuckPending(): Promise<{ updated: number; error?: string }> {
  const minus10m = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("analysis_module_results")
    .update({ status: "failed" })
    .eq("status", "pending")
    .lt("created_at", minus10m)
    .select("id");

  if (error) {
    return { updated: 0, error: error.message };
  }

  revalidatePath("/admin/monitor");
  return { updated: data?.length ?? 0 };
}
