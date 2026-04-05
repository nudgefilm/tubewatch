import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildAnalysisReportPrompt, callGeminiForAnalysisReport } from "@/lib/server/onepager/generateAnalysisReport";

export const maxDuration = 60;

const MODULE_KEY = "analysis_report";
const PENDING_EXPIRE_MS = 5 * 60 * 1000; // 5분 후 pending 만료 → 재시도 허용

/** GET — DB에서 저장된 analysis_report 읽기. 없으면 on-demand 생성 트리거. */
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

    // 완료된 결과 있으면 반환
    if (mod?.status === "completed") {
      const markdown = (mod.result as Record<string, unknown>)?.markdown as string | null;
      return NextResponse.json({ markdown: markdown ?? null, pending: false });
    }

    // pending row가 있고 아직 만료 안 됨 → 생성 중
    if (mod?.status === "pending") {
      const age = Date.now() - new Date(mod.analyzed_at as string).getTime();
      if (age < PENDING_EXPIRE_MS) {
        return NextResponse.json({ markdown: null, pending: true });
      }
      // 만료된 pending → 삭제 후 재시도
      await supabaseAdmin
        .from("analysis_module_results")
        .delete()
        .eq("snapshot_id", snap.id)
        .eq("module_key", MODULE_KEY)
        .eq("status", "pending");
    }

    // 없거나 만료 → pending row 삽입 시도 (중복 삽입 방지)
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
      // 다른 요청이 이미 INSERT함 → pending 중
      console.log("[analysis-report] pending row already exists (race condition ok)");
      return NextResponse.json({ markdown: null, pending: true });
    }

    // 첫 번째 요청만 생성 트리거
    const snapId = snap.id;
    waitUntil((async () => {
      try {
        const { data: snapData } = await supabaseAdmin
          .from("analysis_results")
          .select("gemini_raw_json, feature_snapshot, feature_total_score, channel_title")
          .eq("id", snapId)
          .maybeSingle();

        if (!snapData) throw new Error("snapshot data not found");

        const prompt = buildAnalysisReportPrompt({
          gemini_raw_json: snapData.gemini_raw_json,
          feature_snapshot: snapData.feature_snapshot,
          channel_title: snapData.channel_title,
          feature_total_score: snapData.feature_total_score,
        });
        const markdown = await callGeminiForAnalysisReport(prompt);

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
          console.log("[analysis-report] generated and saved:", snapId);
        } else {
          throw new Error("Gemini returned null");
        }
      } catch (e) {
        console.error("[analysis-report] generation failed (non-fatal):", e);
        // 실패 시 pending 삭제 → 다음 폴링에서 재시도 가능
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
    console.error("[analysis-report GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
