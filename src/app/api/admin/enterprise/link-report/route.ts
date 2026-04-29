import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { orderId, token } = await request.json();
  if (!orderId || !token) {
    return NextResponse.json({ error: "orderId, token 필요" }, { status: 400 });
  }

  // token 유효성 확인 (manus_reports에 존재하는지)
  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status")
    .eq("access_token", token)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: "존재하지 않는 리포트 토큰입니다." }, { status: 404 });
  }

  // 현재 report_tokens 배열 조회 후 중복 없이 append
  const { data: order } = await supabaseAdmin
    .from("enterprise_orders")
    .select("report_tokens")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const existing: string[] = order.report_tokens ?? [];
  if (existing.includes(token)) {
    return NextResponse.json({ ok: true, tokens: existing, skipped: true });
  }

  const updated = [...existing, token];

  const { error } = await supabaseAdmin
    .from("enterprise_orders")
    .update({ report_tokens: updated })
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });

  return NextResponse.json({ ok: true, tokens: updated });
}

export async function DELETE(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { orderId, token } = await request.json();
  if (!orderId || !token) {
    return NextResponse.json({ error: "orderId, token 필요" }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from("enterprise_orders")
    .select("report_tokens")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

  const updated = (order.report_tokens ?? []).filter((t: string) => t !== token);

  const { error } = await supabaseAdmin
    .from("enterprise_orders")
    .update({ report_tokens: updated })
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });

  return NextResponse.json({ ok: true, tokens: updated });
}
