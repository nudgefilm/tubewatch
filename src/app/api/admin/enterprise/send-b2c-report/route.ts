import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";
import { sendB2CReportReadyEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { inquiryId, token } = await request.json();
  if (!inquiryId || !token) {
    return NextResponse.json({ error: "inquiryId, token 필요" }, { status: 400 });
  }

  const { data: inquiry } = await supabaseAdmin
    .from("b2c_consulting_inquiries")
    .select("contact_email, channel_name, channel_url, report_tokens")
    .eq("id", inquiryId)
    .single();

  if (!inquiry) {
    return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  }

  const tokens: string[] = inquiry.report_tokens ?? [];
  if (!tokens.includes(token)) {
    return NextResponse.json({ error: "연결되지 않은 리포트 토큰입니다." }, { status: 400 });
  }

  await sendB2CReportReadyEmail({
    to: inquiry.contact_email,
    channelName: inquiry.channel_name,
    channelUrl: inquiry.channel_url,
    reportToken: token,
  });

  return NextResponse.json({ ok: true });
}
