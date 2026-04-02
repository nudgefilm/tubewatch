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

  const { data, error } = await supabaseAdmin
    .from("analysis_jobs")
    .select("id, status, progress_step, started_at")
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

  return NextResponse.json({
    job: {
      id: (data as { id: string }).id,
      status: (data as { status: string }).status,
      progress_step: (data as { progress_step: string | null }).progress_step ?? null,
    },
  });
}
