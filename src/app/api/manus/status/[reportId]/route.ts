export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/manus/status/[reportId]
// 프론트엔드 폴링용 — 리포트 생성 상태 확인
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status, access_token, error_message, created_at, updated_at")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: report.id,
    status: report.status,
    access_token: report.access_token,
    error_message: report.error_message,
    created_at: report.created_at,
    updated_at: report.updated_at,
  });
}
