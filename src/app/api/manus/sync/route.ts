export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTaskMessages } from "@/lib/manus/client";
import type { ManusReportJson } from "@/lib/manus/types";

// POST /api/manus/sync
// Body: { report_id: string }
// webhook이 오지 않을 때 폴링 페이지가 직접 Manus API를 확인해 DB를 갱신
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reportId: string | undefined = body?.report_id;
  if (!reportId) return NextResponse.json({ error: "report_id required" }, { status: 400 });

  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, user_id, status, manus_task_id, created_at")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.status !== "processing" && report.status !== "pending") {
    return NextResponse.json({ status: report.status });
  }
  if (!report.manus_task_id) {
    return NextResponse.json({ status: report.status });
  }

  try {
    const { messages } = await getTaskMessages(report.manus_task_id);

    // 완료 여부 확인 (status_update agent_status === "stopped")
    const isStopped = messages.some(
      (m) => m.type === "status_update" && m.status_update.agent_status === "stopped"
    );
    if (!isStopped) {
      return NextResponse.json({ status: "processing" });
    }

    // 마지막 assistant 메시지에서 JSON 추출
    const assistantMessages = messages.filter((m) => m.type === "assistant_message");
    const lastMsg = assistantMessages[assistantMessages.length - 1];
    const content = lastMsg?.type === "assistant_message"
      ? lastMsg.assistant_message.content
      : undefined;

    if (!content) throw new Error("No assistant message found");

    const raw = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const resultJson = JSON.parse(raw) as ManusReportJson;

    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "completed", result_json: resultJson, error_message: null })
      .eq("id", report.id);

    return NextResponse.json({ status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "failed", error_message: message })
      .eq("id", report.id);
    return NextResponse.json({ status: "failed", error: message });
  }
}
