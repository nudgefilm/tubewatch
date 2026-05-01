import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendB2CConsultingAlert, sendB2CConsultingPaymentLink } from "@/lib/email/resend";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const channelName   = typeof raw.channelName   === "string" ? raw.channelName.trim()   : "";
  const rawChannelUrl = typeof raw.channelUrl    === "string" ? raw.channelUrl.trim()    : "";
  const contactEmail  = typeof raw.contactEmail  === "string" ? raw.contactEmail.trim()  : "";
  const concerns      = Array.isArray(raw.concerns) ? (raw.concerns as string[]).filter(Boolean) : [];
  const concernOther  = typeof raw.concernOther  === "string" ? raw.concernOther.trim()  || null : null;
  const contactPhone  = typeof raw.contactPhone  === "string" ? raw.contactPhone.trim()  || null : null;

  const channelUrl = rawChannelUrl && !/^https?:\/\//i.test(rawChannelUrl)
    ? `https://${rawChannelUrl}`
    : rawChannelUrl;

  if (!channelName || !channelUrl || !contactEmail) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("b2c_consulting_inquiries")
    .insert({
      channel_name: channelName,
      channel_url: channelUrl,
      contact_email: contactEmail,
      concerns,
      concern_other: concernOther,
      contact_phone: contactPhone,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[b2c-consulting] insert error:", error);
    return NextResponse.json({ error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  try {
    await Promise.all([
      sendB2CConsultingAlert({
        inquiryId: data.id,
        channelName,
        channelUrl,
        contactEmail,
        concerns,
        concernOther,
        contactPhone,
      }),
      sendB2CConsultingPaymentLink({
        to: contactEmail,
        channelName,
        channelUrl,
      }),
    ]);
    await supabaseAdmin
      .from("b2c_consulting_inquiries")
      .update({ status: "payment_sent" })
      .eq("id", data.id);
  } catch (emailErr) {
    console.error("[b2c-consulting] email error:", emailErr);
  }

  return NextResponse.json({ ok: true, inquiryId: data.id });
}
