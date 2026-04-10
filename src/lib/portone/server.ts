/**
 * PortOne V2 서버사이드 REST API 클라이언트.
 * https://developers.portone.io/api/rest-v2
 *
 * 필수 환경 변수:
 *   PORTONE_API_SECRET   — PortOne 콘솔 > API 키 > V2 API Secret
 */

const PORTONE_API_URL = "https://api.portone.io";

function getApiSecret(): string {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) throw new Error("PORTONE_API_SECRET 환경 변수가 설정되지 않았습니다.");
  return secret;
}

async function portoneRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PORTONE_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `PortOne ${getApiSecret()}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(empty)");
    throw new Error(`PortOne API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortOnePaymentStatus =
  | "READY"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED";

export interface PortOnePayment {
  id: string;
  status: PortOnePaymentStatus;
  amount: { total: number; currency: string };
  customer?: { id?: string; email?: string };
  customData?: string;
  paidAt?: string;
}

// ─── API calls ───────────────────────────────────────────────────────────────

/** 결제 단건 조회 */
export async function getPortOnePayment(paymentId: string): Promise<PortOnePayment> {
  return portoneRequest<PortOnePayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

/** 결제 취소 */
export async function cancelPortOnePayment(paymentId: string, reason: string): Promise<void> {
  await portoneRequest(`/payments/${encodeURIComponent(paymentId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export interface BillingKeyChargeParams {
  billingKey: string;
  paymentId: string;
  orderName: string;
  amountKrw: number;
  customerId: string;
  customerEmail?: string;
}

/** 빌링키로 결제 (정기결제용) */
export async function chargePortOneBillingKey(
  params: BillingKeyChargeParams
): Promise<PortOnePayment> {
  return portoneRequest<PortOnePayment>(
    `/billing-keys/${encodeURIComponent(params.billingKey)}/payments`,
    {
      method: "POST",
      body: JSON.stringify({
        paymentId: params.paymentId,
        orderName: params.orderName,
        amount: { total: params.amountKrw },
        currency: "KRW",
        customer: {
          id: params.customerId,
          email: params.customerEmail,
        },
      }),
    }
  );
}
