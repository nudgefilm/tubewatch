import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";
import { sendPaymentLinkEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { inquiryId } = await request.json();
  if (!inquiryId) return NextResponse.json({ error: "inquiryId 필요" }, { status: 400 });

  const { data: inquiry } = await supabaseAdmin
    .from("b2b_inquiries")
    .select("agency_name, contact_email, channel_url, status")
    .eq("id", inquiryId)
    .single();

  if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  if (inquiry.status !== "new") return NextResponse.json({ error: "이미 처리된 문의입니다." }, { status: 400 });

  await sendPaymentLinkEmail({
    to: inquiry.contact_email,
    agencyName: inquiry.agency_name,
    channelUrl: inquiry.channel_url,
    inquiryId,
  });

  await supabaseAdmin
    .from("b2b_inquiries")
    .update({ status: "payment_sent" })
    .eq("id", inquiryId);

  return NextResponse.json({ ok: true });
}
