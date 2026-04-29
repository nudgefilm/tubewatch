import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendB2BInquiryAlert } from "@/lib/email/resend";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const agencyName    = typeof raw.agencyName    === "string" ? raw.agencyName.trim()    : "";
  const contactName   = typeof raw.contactName   === "string" ? raw.contactName.trim()   : "";
  const contactEmail  = typeof raw.contactEmail  === "string" ? raw.contactEmail.trim()  : "";
  const contactPhone  = typeof raw.contactPhone  === "string" ? raw.contactPhone.trim()  : null;
  const rawChannelUrl = typeof raw.channelUrl === "string" ? raw.channelUrl.trim() : "";
  const channelUrl = rawChannelUrl && !/^https?:\/\//i.test(rawChannelUrl)
    ? `https://${rawChannelUrl}`
    : rawChannelUrl;
  const taxInvoiceRequested = raw.taxInvoiceRequested === true;
  const taxInvoiceInfo = typeof raw.taxInvoiceInfo === "string" ? raw.taxInvoiceInfo.trim() : null;

  if (!agencyName || !contactName || !contactEmail || !channelUrl) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("b2b_inquiries")
    .insert({
      agency_name: agencyName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      channel_url: channelUrl,
      tax_invoice_requested: taxInvoiceRequested,
      tax_invoice_info: taxInvoiceInfo,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[b2b-inquiry] insert error:", error);
    return NextResponse.json({ error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  try {
    await sendB2BInquiryAlert({
      inquiryId: data.id,
      agencyName,
      contactName,
      contactEmail,
      contactPhone,
      channelUrl,
      taxInvoiceRequested,
    });
  } catch (emailErr) {
    console.error("[b2b-inquiry] email error:", emailErr);
  }

  return NextResponse.json({ ok: true, inquiryId: data.id });
}
