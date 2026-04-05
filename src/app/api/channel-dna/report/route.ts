import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildChannelDnaReportPrompt, callGeminiForChannelDnaReport } from "@/lib/server/onepager/generateChannelDnaReport";

export const maxDuration = 60;

const MODULE_KEY = "channel_dna_report";
const PENDING_EXPIRE_MS = 5 * 60 * 1000;

/** GET — DB에서 저장된 channel_dna_report 읽기. 없으면 on-demand 생성 트리거. */
export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 최신 snapshot 조회
    const { data: snap } = await supabase
      .from("analysis_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("user_channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap) return NextResponse.json({ markdown: null, pending: false });

    // module_results 조회
    const { data: mod } = await supabaseAdmin
      .from("analysis_module_results")
      .select("result, status, analyzed_at")
      .eq("snapshot_id", snap.id)
      .eq("module_key", MODULE_KEY)
      .maybeSingle();

    if (mod?.status === "completed") {
      const markdown = (mod.result as Record<string, unknown>)?.markdown as string | null;
      return NextResponse.json({ markdown: markdown ?? null, pending: false });
    }

    if (mod?.status === "pending") {
      const age = Date.now() - new Date(mod.analyzed_at as string).getTime();
      if (age < PENDING_EXPIRE_MS) {
        return NextResponse.json({ markdown: null, pending: true });
      }
      await supabaseAdmin
        .from("analysis_module_results")
        .delete()
        .eq("snapshot_id", snap.id)
        .eq("module_key", MODULE_KEY)
        .eq("status", "pending");
    }

    const { error: insertErr } = await supabaseAdmin
      .from("analysis_module_results")
      .insert({
        user_id: user.id,
        channel_id: channelId,
        snapshot_id: snap.id,
        module_key: MODULE_KEY,
        result: {},
        status: "pending",
        analyzed_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.log("[channel-dna-report] pending row already exists (race condition ok)");
      return NextResponse.json({ markdown: null, pending: true });
    }

    const snapId = snap.id;
    waitUntil((async () => {
      try {
        const { data: snapData } = await supabaseAdmin
          .from("analysis_results")
          .select("gemini_raw_json, feature_snapshot, channel_title")
          .eq("id", snapId)
          .maybeSingle();

        if (!snapData) throw new Error("snapshot data not found");

        const prompt = buildChannelDnaReportPrompt({
          gemini_raw_json: snapData.gemini_raw_json,
          feature_snapshot: snapData.feature_snapshot,
          channel_title: snapData.channel_title,
        });
        const markdown = await callGeminiForChannelDnaReport(prompt);

        if (markdown) {
          await supabaseAdmin.from("analysis_module_results").upsert({
            user_id: user.id,
            channel_id: channelId,
            snapshot_id: snapId,
            module_key: MODULE_KEY,
            result: { markdown },
            status: "completed",
            analyzed_at: new Date().toISOString(),
          }, { onConflict: "snapshot_id,module_key" });
          console.log("[channel-dna-report] generated and saved:", snapId);
        } else {
          throw new Error("Gemini returned null");
        }
      } catch (e) {
        console.error("[channel-dna-report] generation failed (non-fatal):", e);
        await supabaseAdmin
          .from("analysis_module_results")
          .delete()
          .eq("snapshot_id", snapId)
          .eq("module_key", MODULE_KEY)
          .eq("status", "pending");
      }
    })());

    return NextResponse.json({ markdown: null, pending: true });
  } catch (e) {
    console.error("[channel-dna-report GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
