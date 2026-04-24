export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/manus/my-reports
// 최근 30일 이내 채널별 최신 리포트 상태 반환 (30일 롤링 쿨다운 기준)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from("manus_reports")
    .select("id, user_channel_id, status, access_token, created_at")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });

  // user_channel_id → 최신 report 매핑 (created_at desc 정렬 기준 첫 번째만 보관)
  const map: Record<string, { id: string; status: string; access_token: string; created_at: string }> = {};
  for (const row of data ?? []) {
    if (!map[row.user_channel_id]) {
      map[row.user_channel_id] = {
        id: row.id,
        status: row.status,
        access_token: row.access_token,
        created_at: row.created_at,
      };
    }
  }

  return NextResponse.json({ reports: map });
}
