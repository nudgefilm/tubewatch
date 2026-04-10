/**
 * PortOne V2 웹훅 이벤트 처리.
 * 결제는 API 라우트에서 동기적으로 검증하므로, 웹훅은 보조 동기화 용도.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

interface PortOneWebhookPayload {
  type: string;
  data?: Record<string, unknown>;
}

export type WebhookResult = { ok: true } | { ok: false; error: string };

export async function handlePortOneWebhook(payload: unknown): Promise<WebhookResult> {
  const event = payload as PortOneWebhookPayload;
  if (typeof event?.type !== "string") {
    return { ok: false, error: "type 필드가 없습니다." };
  }

  console.log("[portone/webhook] event type:", event.type, event.data);

  switch (event.type) {
    case "Transaction.Cancelled":
    case "Transaction.Failed": {
      const paymentId = event.data?.paymentId as string | undefined;
      if (paymentId) {
        await supabaseAdmin
          .from("user_subscriptions")
          .update({
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("portone_payment_id", paymentId);
      }
      return { ok: true };
    }

    // 이미 API 라우트에서 동기 처리 — 웹훅은 확인만
    case "Transaction.Paid":
    case "BillingKey.Issued":
    case "BillingKey.Deleted":
    case "BillingKey.Failed":
      return { ok: true };

    default:
      console.log("[portone/webhook] unhandled event:", event.type);
      return { ok: true };
  }
}
