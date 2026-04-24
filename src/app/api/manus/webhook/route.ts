export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTaskMessages } from "@/lib/manus/client";
import type { ManusWebhookPayload, ManusReportJson } from "@/lib/manus/types";

// POST /api/manus/webhook
// Manus가 task_stopped 이벤트 발생 시 호출
export async function POST(req: Request) {
  let payload: ManusWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "task_stopped" || !payload.task_id) {
    return NextResponse.json({ ok: true }); // 무관한 이벤트는 무시
  }

  // task_id로 리포트 레코드 조회
  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status")
    .eq("manus_task_id", payload.task_id)
    .maybeSingle();

  if (!report || report.status === "completed") {
    return NextResponse.json({ ok: true }); // 이미 처리됐거나 없는 태스크
  }

  try {
    // Manus에서 메시지 가져오기
    const { messages } = await getTaskMessages(payload.task_id);

    // 마지막 assistant 메시지에서 JSON 추출
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastMessage = assistantMessages[assistantMessages.length - 1];

    if (!lastMessage?.content) {
      throw new Error("No assistant message found");
    }

    // JSON 파싱 (마크다운 코드블록이 있을 경우 제거)
    const raw = lastMessage.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const resultJson = JSON.parse(raw) as ManusReportJson;

    await supabaseAdmin
      .from("manus_reports")
      .update({
        status: "completed",
        result_json: resultJson,
        error_message: null,
      })
      .eq("id", report.id);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabaseAdmin
      .from("manus_reports")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", report.id);
  }

  return NextResponse.json({ ok: true });
}
