import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { sendDiagnoseLeadReport } from "@/lib/email/resend";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const isAdmin = await isAdminUser(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const leadId      = typeof body.leadId      === "string" ? body.leadId.trim()      : "";
  const reportToken = typeof body.reportToken === "string" ? body.reportToken.trim() : "";

  if (!leadId || !reportToken) {
    return NextResponse.json({ error: "leadId와 reportToken이 필요합니다." }, { status: 400 });
  }

  const { data: lead, error: fetchError } = await supabaseAdmin
    .from("channel_diagnose_leads")
    .select("id, channel_url, contact_email, status")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id")
    .eq("access_token", reportToken)
    .maybeSingle();

  if (!report) {
    return NextResponse.json(
      { error: "리포트 토큰을 찾을 수 없습니다." },
      { status: 400 },
    );
  }

  await sendDiagnoseLeadReport({
    to: lead.contact_email,
    channelUrl: lead.channel_url,
    reportToken,
  });

  await supabaseAdmin
    .from("channel_diagnose_leads")
    .update({ status: "report_sent", report_token: reportToken })
    .eq("id", leadId);

  return NextResponse.json({ ok: true });
}
