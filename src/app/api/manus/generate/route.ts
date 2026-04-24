export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/manus/generate
// Claude 호출 없이 DB row만 생성하고 access_token 즉시 반환
// 실제 생성은 /api/manus/stream SSE 엔드포인트에서 처리
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userChannelId: string | undefined = body?.user_channel_id;
  if (!userChannelId) {
    return NextResponse.json({ error: "user_channel_id required" }, { status: 400 });
  }

  // 채널 소유권 검증
  const { data: channel } = await supabaseAdmin
    .from("user_channels")
    .select("id")
    .eq("id", userChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // 월 1회 제한 확인 (KST 기준)
  const yearMonth = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);

  const { data: existing } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status, access_token, created_at")
    .eq("user_channel_id", userChannelId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (existing) {
    if (existing.status === "completed") {
      return NextResponse.json({
        error: "already_generated",
        report_id: existing.id,
        status: existing.status,
        access_token: existing.access_token,
      }, { status: 409 });
    }
    // processing 5분 이내 → SSE 페이지로 안내
    if (existing.status === "processing") {
      const ageMs = Date.now() - new Date(existing.created_at).getTime();
      if (ageMs < 5 * 60 * 1000) {
        return NextResponse.json({
          error: "already_generated",
          report_id: existing.id,
          status: existing.status,
          access_token: existing.access_token,
        }, { status: 409 });
      }
    }
    // failed 또는 5분 초과 processing → 삭제 후 재생성
    await supabaseAdmin.from("manus_reports").delete().eq("id", existing.id);
  }

  // 분석 결과 존재 여부 확인
  const { data: result } = await supabaseAdmin
    .from("analysis_results")
    .select("id")
    .eq("user_channel_id", userChannelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "분석 결과가 없습니다. 먼저 채널 분석을 실행해주세요." }, { status: 404 });
  }

  // DB에 processing 상태로 삽입 — Claude 호출은 /api/manus/stream에서 처리
  const { data: reportRow, error: insertError } = await supabaseAdmin
    .from("manus_reports")
    .insert({
      user_id: user.id,
      user_channel_id: userChannelId,
      snapshot_id: result.id,
      year_month: yearMonth,
      status: "processing",
    })
    .select("id, access_token")
    .single();

  if (insertError || !reportRow) {
    return NextResponse.json({ error: "리포트 레코드 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    report_id: reportRow.id,
    access_token: reportRow.access_token,
    status: "processing",
  });
}
