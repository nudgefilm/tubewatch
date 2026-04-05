import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET — analysis_report 조회. 없으면 pending:true 반환 (생성은 메인 분석 route에서 처리). */
export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: snap } = await supabase
      .from("analysis_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap) return NextResponse.json({ markdown: null, pending: false });

    const { data: mod } = await supabaseAdmin
      .from("analysis_module_results")
      .select("result, status, started_at")
      .eq("snapshot_id", snap.id)
      .eq("user_id", user.id)
      .eq("module_key", "analysis_report")
      .maybeSingle();

    if (!mod) return NextResponse.json({ markdown: null, pending: false, reason: "no_record" });
    if (mod.status === "failed") return NextResponse.json({ markdown: null, pending: false, reason: "failed" });
    if (mod.status === "pending") {
      const startedAt = mod.started_at ? new Date(mod.started_at as string).getTime() : null;
      if (startedAt === null) {
        // started_at 없는 pending = legacy/edge case → 무한 폴링 차단
        console.warn("[onepager-api] timeout-fallback: started_at missing", { snapshot_id: snap.id, module_key: "analysis_report" });
        return NextResponse.json({ markdown: null, pending: false, reason: "timeout" });
      }
      const isTimeout = Date.now() - startedAt > 10 * 60 * 1000;
      if (isTimeout) return NextResponse.json({ markdown: null, pending: false, reason: "timeout" });
      return NextResponse.json({ markdown: null, pending: true });
    }

    const markdown = (mod.result as Record<string, unknown>)?.markdown as string | null;
    console.log("[onepager-api]", {
      snapshot_id: snap.id, module_key: "analysis_report",
      status: mod.status, started_at: mod.started_at, hasMarkdown: !!markdown,
    });
    return NextResponse.json({ markdown: markdown ?? null, pending: false });
  } catch (e) {
    console.error("[analysis-report GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
