import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendEnterpriseOrderAlert,
  sendEnterpriseOrderConfirmation,
} from "@/lib/email/resend";

type EnterpriseOrderForEmail = {
  id: string;
  email: string;
  channel_url: string;
  contact_phone: string | null;
  source: string;
  inquiry_id: string | null;
};

/**
 * 원자적 선점(email_sent false→true) 후 이메일 발송.
 * payment-complete와 resend-email API 양쪽에서 재사용.
 */
export async function processEnterpriseEmailSend(
  order: EnterpriseOrderForEmail
): Promise<{ skipped: boolean }> {
  const { data: claimed } = await supabaseAdmin
    .from("enterprise_orders")
    .update({ email_sent: true })
    .eq("id", order.id)
    .eq("email_sent", false)
    .select("id");

  if (!claimed || claimed.length === 0) {
    return { skipped: true };
  }

  try {
    await sendEnterpriseOrderAlert({
      orderId: order.id,
      channelUrl: order.channel_url,
      email: order.email,
      contactPhone: order.contact_phone,
      source: order.source,
      inquiryId: order.inquiry_id,
    });
    await sendEnterpriseOrderConfirmation({
      to: order.email,
      channelUrl: order.channel_url,
      orderId: order.id,
    });
  } catch (e) {
    console.error("[processEnterpriseEmailSend] email error:", e);
  }

  return { skipped: false };
}
