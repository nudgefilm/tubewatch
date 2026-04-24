export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/manus/my-reports
// 현재 달 기준 사용자의 채널별 리포트 상태 반환
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yearMonth = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);

  const { data } = await supabaseAdmin
    .from("manus_reports")
    .select("id, user_channel_id, status, access_token, created_at")
    .eq("user_id", user.id)
    .eq("year_month", yearMonth);

  // user_channel_id → report 매핑
  const map: Record<string, { id: string; status: string; access_token: string; created_at: string }> = {};
  for (const row of data ?? []) {
    map[row.user_channel_id] = {
      id: row.id,
      status: row.status,
      access_token: row.access_token,
      created_at: row.created_at,
    };
  }

  return NextResponse.json({ reports: map });
}
