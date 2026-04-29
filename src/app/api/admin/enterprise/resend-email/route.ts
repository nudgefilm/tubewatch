import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";
import { processEnterpriseEmailSend } from "@/lib/server/enterprise/processEnterpriseEmailSend";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId 필요" }, { status: 400 });

  // email_sent 리셋 (paid 상태만 허용)
  const { data: reset, error: resetError } = await supabaseAdmin
    .from("enterprise_orders")
    .update({ email_sent: false })
    .eq("id", orderId)
    .eq("status", "paid")
    .select("id, email, channel_url, contact_phone, source, inquiry_id")
    .single();

  if (resetError || !reset) {
    return NextResponse.json({ ok: false, reason: "not_found_or_invalid_status" }, { status: 404 });
  }

  // 원자적 선점 + 이메일 발송 (기존 dedupe 로직 재사용)
  const { skipped } = await processEnterpriseEmailSend(reset);

  if (skipped) {
    return NextResponse.json({ ok: false, reason: "claim_failed" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, resent: true });
}
