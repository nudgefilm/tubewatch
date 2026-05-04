import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendDiagnoseLeadConfirmation,
  sendDiagnoseLeadAlert,
} from "@/lib/email/resend";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const rawChannelUrl = typeof raw.channelUrl === "string" ? raw.channelUrl.trim() : "";
  const contactEmail  = typeof raw.contactEmail === "string" ? raw.contactEmail.trim() : "";

  const channelUrl = rawChannelUrl && !/^https?:\/\//i.test(rawChannelUrl)
    ? `https://${rawChannelUrl}`
    : rawChannelUrl;

  if (!channelUrl || !contactEmail) {
    return NextResponse.json({ error: "채널 주소와 이메일을 모두 입력해주세요." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "올바른 이메일 형식을 입력해주세요." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("channel_diagnose_leads")
    .insert({ channel_url: channelUrl, contact_email: contactEmail })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[diagnose-lead] insert error:", error);
    return NextResponse.json({ error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  try {
    await Promise.all([
      sendDiagnoseLeadConfirmation({ to: contactEmail, channelUrl }),
      sendDiagnoseLeadAlert({ leadId: data.id, channelUrl, contactEmail }),
    ]);
  } catch (emailErr) {
    console.error("[diagnose-lead] email error:", emailErr);
  }

  return NextResponse.json({ ok: true });
}
