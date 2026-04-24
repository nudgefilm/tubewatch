export const dynamic = "force-dynamic";
export const maxDuration = 120; // Vercel Pro — Claude 응답 대기

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateReport } from "@/lib/claude/reportClient";
import { buildReportPayload } from "@/lib/manus/prompt";
import type { NormalizedVideo } from "@/lib/analysis/engine/types";

// POST /api/manus/process
// Body: { report_id: string }
// 클라이언트(ReportPolling)가 마운트 시 호출 — Claude API를 동기 실행
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reportId: string | undefined = body?.report_id;
  if (!reportId) return NextResponse.json({ error: "report_id required" }, { status: 400 });

  // 리포트 조회 + 소유권 확인
  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status, user_channel_id, snapshot_id, updated_at")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 이미 완료/실패 → 재실행 불필요
  if (report.status === "completed" || report.status === "failed") {
    return NextResponse.json({ status: report.status });
  }

  // processing 상태이지만 90초 이내면 이미 다른 요청이 처리 중 → 건너뜀
  const ageMs = Date.now() - new Date(report.updated_at).getTime();
  if (ageMs < 90 * 1000) {
    return NextResponse.json({ status: "processing", message: "already running" });
  }

  // updated_at 갱신으로 중복 실행 방지 (낙관적 락)
  await supabaseAdmin
    .from("manus_reports")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", reportId);

  // 분석 결과 + 채널 정보 다시 조회
  const { data: channel } = await supabaseAdmin
    .from("user_channels")
    .select("channel_title, channel_id, subscriber_count, view_count, video_count, description, published_at")
    .eq("id", report.user_channel_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: result } = await supabaseAdmin
    .from("analysis_results")
    .select("id, feature_snapshot")
    .eq("id", report.snapshot_id)
    .maybeSingle();

  if (!channel || !result) {
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "failed", error_message: "Channel or analysis data missing" })
      .eq("id", reportId);
    return NextResponse.json({ error: "Data missing" }, { status: 404 });
  }

  const { data: moduleRows } = await supabaseAdmin
    .from("analysis_module_results")
    .select("module_key, result")
    .eq("snapshot_id", result.id)
    .eq("user_id", user.id)
    .eq("status", "completed");

  const moduleMap: Record<string, Record<string, unknown>> = {};
  for (const row of moduleRows ?? []) {
    moduleMap[row.module_key] = row.result as Record<string, unknown>;
  }

  const snapshot = result.feature_snapshot as {
    channel?: { description?: string; publishedAt?: string };
    videos?: NormalizedVideo[];
    metrics?: {
      avgViewCount: number; medianViewCount: number; avgLikeRatio: number;
      avgCommentRatio: number; avgVideoDuration: number; avgUploadIntervalDays: number;
      recent30dUploadCount: number; avgTitleLength: number; avgTagCount: number;
    };
  } | null;

  const payload = buildReportPayload({
    channelName: channel.channel_title ?? "채널",
    channelDescription: snapshot?.channel?.description ?? channel.description ?? "",
    subscriberCount: channel.subscriber_count ?? 0,
    totalViewCount: channel.view_count ?? 0,
    videoCount: channel.video_count ?? 0,
    publishedAt: snapshot?.channel?.publishedAt ?? channel.published_at ?? null,
    metrics: snapshot?.metrics ?? {
      avgViewCount: 0, medianViewCount: 0, avgLikeRatio: 0, avgCommentRatio: 0,
      avgVideoDuration: 0, avgUploadIntervalDays: 0, recent30dUploadCount: 0,
      avgTitleLength: 0, avgTagCount: 0,
    },
    videos: snapshot?.videos ?? [],
    channelDna: moduleMap["channel_dna"] ?? null,
    actionPlan: moduleMap["action_plan"] ?? null,
    nextTrend: moduleMap["next_trend"] ?? null,
  });

  try {
    const resultJson = await generateReport(payload);
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "completed", result_json: resultJson, error_message: null })
      .eq("id", reportId);
    return NextResponse.json({ status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "failed", error_message: message })
      .eq("id", reportId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
