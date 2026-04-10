/**
 * POST /api/portone/webhook
 * PortOne V2 웹훅 수신 및 서명 검증.
 *
 * 필수 환경 변수 (선택적):
 *   PORTONE_WEBHOOK_SECRET — PortOne 콘솔에서 발급한 웹훅 서명 시크릿
 *
 * 서명 형식: portone-signature 헤더 = "t={timestamp},v1={hmac-sha256-hex}"
 * 검증 메시지: "{timestamp}.{raw_body}"
 */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { handlePortOneWebhook } from "@/lib/server/portone/handleWebhook";

function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts: Record<string, string> = {};
    for (const segment of signatureHeader.split(",")) {
      const eqIdx = segment.indexOf("=");
      if (eqIdx !== -1) {
        parts[segment.slice(0, eqIdx)] = segment.slice(eqIdx + 1);
      }
    }
    const { t: timestamp, v1: receivedSig } = parts;
    if (!timestamp || !receivedSig) return false;

    const message = `${timestamp}.${rawBody}`;
    const expectedBuf = crypto.createHmac("sha256", secret).update(message).digest();
    const receivedBuf = Buffer.from(receivedSig, "hex");

    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signatureHeader = request.headers.get("portone-signature") ?? "";
    if (!signatureHeader || !verifySignature(rawBody, signatureHeader, webhookSecret)) {
      console.warn("[portone/webhook] signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await handlePortOneWebhook(payload);
  if (!result.ok) {
    console.error("[portone/webhook] handler error:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
