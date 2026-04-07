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

  const d = data as { id: string; status: string; progress_step: string | null; retry_after: string | null; retry_count: number };
  return NextResponse.json({
    job: {
      id: d.id,
      status: d.status,
      progress_step: d.progress_step ?? null,
      retry_after: d.retry_after ?? null,
    },
  });
}
