export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/analysis/job-status?channelId=<user_channel_id>
 * 최신 analysis_job의 progress_step을 반환한다. 클라이언트 폴링용.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 삭제된 채널 or 타인 채널 접근 방지 — user_channels 소유권 검증
  const { data: channelRow } = await supabase
    .from("user_channels")
    .select("id")
    .eq("id", channelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!channelRow) {
    return NextResponse.json({ job: null });
  }

  const { data, error } = await supabaseAdmin
    .from("analysis_jobs")
    .select("id, status, progress_step, started_at, retry_after, retry_count")
    .eq("user_channel_id", channelId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ job: null });
  }

  const d = data as { id: string; status: string; progress_step: string | null; started_at: string | null; retry_after: string | null; retry_count: number };

  // Vercel 함수 강제 종료(90s timeout)로 job이 "running" 상태에 고착되는 경우 감지.
  // maxDuration=90이므로 120s 이상 running이면 사실상 실패로 취급해 클라이언트가 재시도 안내를 표시할 수 있도록 함.
  const STUCK_THRESHOLD_MS = 120 * 1000;
  if (d.status === "running" && d.started_at) {
    const elapsed = Date.now() - new Date(d.started_at).getTime();
    if (elapsed > STUCK_THRESHOLD_MS) {
      console.warn("[job-status] stuck job detected:", d.id, "elapsed:", Math.round(elapsed / 1000) + "s");
      return NextResponse.json({
        job: {
          id: d.id,
          status: "failed",
          progress_step: "failed",
          retry_after: null,
        },
      });
    }
  }

  return NextResponse.json({
    job: {
      id: d.id,
      status: d.status,
      progress_step: d.progress_step ?? null,
      retry_after: d.retry_after ?? null,
    },
  });
}
