export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTaskMessages } from "@/lib/manus/client";
import type { ManusWebhookPayload, ManusReportJson } from "@/lib/manus/types";

// GET /api/manus/webhook — Manus URL 검증용
export async function GET() {
  return NextResponse.json({ ok: true });
}

// POST /api/manus/webhook
// Manus가 task_stopped 이벤트 발생 시 호출
export async function POST(req: Request) {
  let payload: ManusWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // task_id가 없는 이벤트는 무시
  if (!payload.task_id) {
    return NextResponse.json({ ok: true });
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

    // 메시지 배열은 최신순(역순) → index 0이 마지막 응답
    const assistantMessages = messages.filter((m) => m.type === "assistant_message");
    const firstMsg = assistantMessages[0];
    const content = firstMsg?.type === "assistant_message"
      ? firstMsg.assistant_message.content
      : undefined;

    if (!content) {
      throw new Error("No assistant message found");
    }

    // JSON 객체 경계를 직접 추출 (코드블록·설명 텍스트 모두 처리)
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end < start) throw new Error("No JSON object found in response");
    const resultJson = JSON.parse(content.slice(start, end + 1)) as ManusReportJson;

    if (!resultJson.section1_scorecard) {
      throw new Error("리포트 스키마 불일치: section1_scorecard 누락. 재신청이 필요합니다.");
    }

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
