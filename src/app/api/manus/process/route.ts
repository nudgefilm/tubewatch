export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateReport } from "@/lib/claude/reportClient";
import { buildReportPayload } from "@/lib/manus/prompt";
import type { NormalizedVideo } from "@/lib/analysis/engine/types";

// POST /api/manus/process
// Body: { access_token: string }
// stuck "processing" 레코드 복구용 — access_token 기반 인증 (세션 불필요)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const accessToken: string | undefined = body?.access_token;
  if (!accessToken) return NextResponse.json({ error: "access_token required" }, { status: 400 });

  // access_token으로 리포트 조회 (processing 상태만)
  const { data: report } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status, user_id, user_channel_id, snapshot_id, created_at, updated_at")
    .eq("access_token", accessToken)
    .maybeSingle();

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.status === "completed") return NextResponse.json({ status: "completed" });
  if (report.status === "failed") return NextResponse.json({ status: "failed" });
  if (report.status !== "processing") return NextResponse.json({ status: report.status });

  // 중복 실행 방지: process가 이미 claimed된 경우만 90초 락 적용
  const createdMs = new Date(report.created_at).getTime();
  const updatedMs = new Date(report.updated_at).getTime();
  if ((updatedMs - createdMs) > 10_000 && (Date.now() - updatedMs) < 90_000) {
    return NextResponse.json({ status: "processing", message: "already running" });
  }

  // 락 획득
  await supabaseAdmin
    .from("manus_reports")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", report.id);

  // 채널 + 분석 데이터 조회
  const { data: channel } = await supabaseAdmin
    .from("user_channels")
    .select("channel_title, channel_id, subscriber_count, view_count, video_count, description, published_at")
    .eq("id", report.user_channel_id)
    .eq("user_id", report.user_id)
    .maybeSingle();

  const { data: result } = await supabaseAdmin
    .from("analysis_results")
    .select("id, feature_snapshot, created_at")
    .eq("id", report.snapshot_id)
    .maybeSingle();

  if (!channel || !result) {
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "failed", error_message: "채널 또는 분석 데이터를 찾을 수 없습니다." })
      .eq("id", report.id);
    return NextResponse.json({ error: "Data missing" }, { status: 404 });
  }

  const { data: moduleRows } = await supabaseAdmin
    .from("analysis_module_results")
    .select("module_key, result")
    .eq("snapshot_id", result.id)
    .eq("user_id", report.user_id)
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

  const analysisDate = (result.created_at as string).slice(0, 10);

  const payload = buildReportPayload({
    channelName: channel.channel_title ?? "채널",
    channelDescription: snapshot?.channel?.description ?? channel.description ?? "",
    subscriberCount: channel.subscriber_count ?? 0,
    totalViewCount: channel.view_count ?? 0,
    videoCount: channel.video_count ?? 0,
    publishedAt: snapshot?.channel?.publishedAt ?? channel.published_at ?? null,
    analysisDate,
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
    const { error: saveError } = await supabaseAdmin
      .from("manus_reports")
      .update({ status: "completed", result_json: resultJson, error_message: null })
      .eq("id", report.id);
    if (saveError) throw new Error(`리포트 저장 실패: ${saveError.message}`);
    return NextResponse.json({ status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "failed", error_message: message })
      .eq("id", report.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
