import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId 필요" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("enterprise_orders")
    .update({ email_sent: false })
    .eq("id", orderId)
    .eq("status", "paid")
    .select("id");

  if (error) return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, reason: "not_found_or_invalid_status" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, reset: true });
}
