import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId 필요" }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from("enterprise_orders")
    .select("reports_issued, total_reports")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

  const newCount = order.reports_issued + 1;
  const isCompleted = newCount >= order.total_reports;

  const { error } = await supabaseAdmin
    .from("enterprise_orders")
    .update({
      reports_issued: newCount,
      status: isCompleted ? "completed" : "analysis_progress",
    })
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });

  return NextResponse.json({ ok: true, reportsIssued: newCount, completed: isCompleted });
}
