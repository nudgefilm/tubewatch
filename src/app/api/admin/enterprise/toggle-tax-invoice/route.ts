import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { orderId, issued } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId 필요" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("enterprise_orders")
    .update({ tax_invoice_issued: !!issued })
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
