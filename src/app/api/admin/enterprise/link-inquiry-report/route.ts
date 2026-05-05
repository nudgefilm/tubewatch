import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";

export async function POST(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { inquiryId, token } = await request.json();
  if (!inquiryId || !token) {
    return NextResponse.json({ error: "inquiryId, token 필요" }, { status: 400 });
  }

  // access_token 또는 report id(uuid) 둘 다 허용
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, access_token")
    .eq(isUuid ? "id" : "access_token", token)
    .maybeSingle();

  if (!report) {
    console.error("[link-inquiry-report] token not found:", { token, isUuid });
    return NextResponse.json({
      error: "존재하지 않는 리포트 토큰입니다.",
      received: token.slice(0, 32),
    }, { status: 404 });
  }

  // 실제 access_token을 저장 (uuid로 조회했을 경우 치환)
  const resolvedToken = report.access_token;

  const { data: inquiry } = await supabaseAdmin
    .from("b2b_inquiries")
    .select("report_tokens")
    .eq("id", inquiryId)
    .single();

  if (!inquiry) {
    return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  }

  const existing: string[] = inquiry.report_tokens ?? [];
  if (existing.includes(resolvedToken)) {
    return NextResponse.json({ ok: true, tokens: existing, skipped: true });
  }

  const updated = [...existing, resolvedToken];

  const { error } = await supabaseAdmin
    .from("b2b_inquiries")
    .update({ report_tokens: updated })
    .eq("id", inquiryId);

  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });

  return NextResponse.json({ ok: true, tokens: updated });
}

export async function DELETE(request: Request) {
  try { await ensureAdminOrRedirect(); } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { inquiryId, token } = await request.json();
  if (!inquiryId || !token) {
    return NextResponse.json({ error: "inquiryId, token 필요" }, { status: 400 });
  }

  const { data: inquiry } = await supabaseAdmin
    .from("b2b_inquiries")
    .select("report_tokens")
    .eq("id", inquiryId)
    .single();

  if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });

  const updated = (inquiry.report_tokens ?? []).filter((t: string) => t !== token);

  const { error } = await supabaseAdmin
    .from("b2b_inquiries")
    .update({ report_tokens: updated })
    .eq("id", inquiryId);

  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });

  return NextResponse.json({ ok: true, tokens: updated });
}
