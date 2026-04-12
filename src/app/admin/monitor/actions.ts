"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Direct Actions (DB 수정 → 즉시 복구) ─────────────────────────────────────

/** Pending 10분+ 모듈을 failed로 강제 전환 */
export async function resetStuckPending(): Promise<{ updated: number; error?: string }> {
  const minus10m = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("analysis_module_results")
    .update({ status: "failed" })
    .eq("status", "pending")
    .lt("created_at", minus10m)
    .select("id");
  if (error) return { updated: 0, error: error.message };
  revalidatePath("/admin/monitor");
  return { updated: data?.length ?? 0 };
}

/** Running 30분+ 잡을 failed로 강제 전환 */
export async function resetStuckRunning(): Promise<{ updated: number; error?: string }> {
  const minus30m = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("analysis_jobs")
    .update({ status: "failed", progress_step: "failed" })
    .eq("status", "running")
    .lt("started_at", minus30m)
    .select("id");
  if (error) return { updated: 0, error: error.message };
  revalidatePath("/admin/monitor");
  return { updated: data?.length ?? 0 };
}

/** 비정상 Queued 잡을 failed로 강제 전환 */
export async function clearStuckQueued(): Promise<{ updated: number; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from("analysis_jobs")
    .update({ status: "failed", progress_step: "failed" })
    .eq("status", "queued")
    .select("id");
  if (error) return { updated: 0, error: error.message };
  revalidatePath("/admin/monitor");
  return { updated: data?.length ?? 0 };
}

// ── Modal Data Actions (조회 전용) ────────────────────────────────────────────

export type FailedJobRow = {
  id: string;
  created_at: string;
  progress_step: string | null;
};

export async function getFailedJobsDetail(): Promise<{ rows: FailedJobRow[]; error?: string }> {
  const minus24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("analysis_jobs")
    .select("id, created_at, progress_step")
    .eq("status", "failed")
    .gte("created_at", minus24h)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as FailedJobRow[] };
}

export type FailedModuleRow = {
  id: string;
  module_type: string;
  created_at: string;
  error_message: string | null;
};

export async function getFailedModulesDetail(): Promise<{ rows: FailedModuleRow[]; error?: string }> {
  const minus24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("analysis_module_results")
    .select("id, module_type, created_at, error_message")
    .eq("status", "failed")
    .gte("created_at", minus24h)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as FailedModuleRow[] };
}

export type NullScoreRow = {
  id: string;
  channel_id: string;
  created_at: string;
};

export async function getNullScoreDetail(): Promise<{ rows: NullScoreRow[]; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from("analysis_results")
    .select("id, channel_id, created_at")
    .is("total_score", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as NullScoreRow[] };
}

export type ModuleLogRow = {
  id: string;
  module_type: string;
  started_at: string;
  analyzed_at: string;
  duration_sec: number;
};

export async function getRecentModuleLogs(): Promise<{ rows: ModuleLogRow[]; error?: string }> {
  const minus24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("analysis_module_results")
    .select("id, module_type, started_at, analyzed_at")
    .eq("status", "completed")
    .not("started_at", "is", null)
    .not("analyzed_at", "is", null)
    .gte("created_at", minus24h)
    .order("analyzed_at", { ascending: false })
    .limit(20);
  if (error) return { rows: [], error: error.message };
  const rows: ModuleLogRow[] = (data ?? []).map((row) => ({
    id: row.id,
    module_type: row.module_type,
    started_at: row.started_at as string,
    analyzed_at: row.analyzed_at as string,
    duration_sec: Math.round(
      Math.max(0, new Date(row.analyzed_at as string).getTime() - new Date(row.started_at as string).getTime()) / 1000
    ),
  }));
  return { rows };
}

export type GeminiTestResult = {
  status: "ok" | "warn" | "error";
  displayValue: string;
  description: string;
};

export async function retestGeminiKey(): Promise<GeminiTestResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: "error", displayValue: "키 없음", description: "GEMINI_API_KEY 미설정" };
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) return { status: "ok", displayValue: "활성", description: "API 키 유효 — 정상 응답" };
    if ([400, 401, 403].includes(res.status)) {
      return { status: "error", displayValue: "비활성", description: `키 무효 (HTTP ${res.status}) — 재발급 필요` };
    }
    return { status: "warn", displayValue: "확인불가", description: `API 응답 이상 (HTTP ${res.status}) — 잠시 후 재확인` };
  } catch {
    return { status: "warn", displayValue: "타임아웃", description: "Gemini API 연결 실패 — 네트워크 또는 일시적 오류" };
  }
}

export type RecentJobRow = {
  id: string;
  status: string;
  created_at: string;
  progress_step: string | null;
};

export async function getRecentJobsLog(): Promise<{ rows: RecentJobRow[]; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from("analysis_jobs")
    .select("id, status, created_at, progress_step")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as RecentJobRow[] };
}
