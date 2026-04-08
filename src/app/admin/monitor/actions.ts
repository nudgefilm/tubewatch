"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * started_at이 null인 completed 모듈 결과 레거시 정리.
 * started_at = analyzed_at (fallback: created_at) 으로 일괄 backfill.
 */
export async function cleanupNullStartedAt(): Promise<{ updated: number; error?: string }> {
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("analysis_module_results")
    .select("id, analyzed_at, created_at")
    .eq("status", "completed")
    .is("started_at", null)
    .limit(500);

  if (fetchError) {
    return { updated: 0, error: fetchError.message };
  }
  if (!rows || rows.length === 0) {
    return { updated: 0 };
  }

  const results = await Promise.all(
    rows.map((row) =>
      supabaseAdmin
        .from("analysis_module_results")
        .update({ started_at: row.analyzed_at ?? row.created_at })
        .eq("id", row.id)
    )
  );

  const failCount = results.filter((r) => r.error).length;
  const updated = rows.length - failCount;

  revalidatePath("/admin/monitor");
  return { updated };
}
