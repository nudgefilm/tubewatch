import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

/** GET — DB에서 저장된 channel_dna_report 읽기 */
export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 최신 snapshot id 조회
    const { data: snap } = await supabase
      .from("analysis_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap) return NextResponse.json({ markdown: null, pending: false });

    // analysis_module_results에서 channel_dna_report 읽기
    const { data: mod } = await supabaseAdmin
      .from("analysis_module_results")
      .select("result, status")
      .eq("snapshot_id", snap.id)
      .eq("module_key", "channel_dna_report")
      .maybeSingle();

    if (!mod) return NextResponse.json({ markdown: null, pending: true });
    if (mod.status !== "completed") return NextResponse.json({ markdown: null, pending: true });

    const markdown = (mod.result as Record<string, unknown>)?.markdown as string | null;
    return NextResponse.json({ markdown: markdown ?? null, pending: false });
  } catch (e) {
    console.error("[channel-dna-report GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
