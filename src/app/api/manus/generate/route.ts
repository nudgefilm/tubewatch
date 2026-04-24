export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createTask } from "@/lib/manus/client";
import { buildReportPayload } from "@/lib/manus/prompt";
import { getOrCreateManusProjectId } from "@/lib/manus/getOrCreateProject";
import type { NormalizedVideo } from "@/lib/analysis/engine/types";

// POST /api/manus/generate
// Body: { user_channel_id: string }
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
    .select("id, channel_title, channel_id, subscriber_count, view_count, video_count, description, published_at")
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
    .select("id, status, access_token")
    .eq("user_channel_id", userChannelId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      error: "already_generated",
      report_id: existing.id,
      status: existing.status,
      access_token: existing.access_token,
    }, { status: 409 });
  }

  // 최신 분석 결과 조회
  const { data: result } = await supabaseAdmin
    .from("analysis_results")
    .select("id, feature_snapshot, channel_summary")
    .eq("user_channel_id", userChannelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "No analysis result found. Please run an analysis first." }, { status: 404 });
  }

  // 모듈 결과 조회
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
      avgViewCount: number;
      medianViewCount: number;
      avgLikeRatio: number;
      avgCommentRatio: number;
      avgVideoDuration: number;
      avgUploadIntervalDays: number;
      recent30dUploadCount: number;
      avgTitleLength: number;
      avgTagCount: number;
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
      avgViewCount: 0,
      medianViewCount: 0,
      avgLikeRatio: 0,
      avgCommentRatio: 0,
      avgVideoDuration: 0,
      avgUploadIntervalDays: 0,
      recent30dUploadCount: 0,
      avgTitleLength: 0,
      avgTagCount: 0,
    },
    videos: snapshot?.videos ?? [],
    channelDna: moduleMap["channel_dna"] ?? null,
    actionPlan: moduleMap["action_plan"] ?? null,
    nextTrend: moduleMap["next_trend"] ?? null,
  });

  // Manus 프로젝트 가져오기 (없으면 생성)
  const projectId = await getOrCreateManusProjectId();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tubewatch.kr";
  const webhookUrl = `${appUrl}/api/manus/webhook`;

  // Manus task 생성
  const taskId = await createTask(projectId, payload, webhookUrl);

  // DB에 pending 상태로 저장
  const { data: reportRow, error: insertError } = await supabaseAdmin
    .from("manus_reports")
    .insert({
      user_id: user.id,
      user_channel_id: userChannelId,
      snapshot_id: result.id,
      year_month: yearMonth,
      manus_task_id: taskId,
      manus_project_id: projectId,
      status: "processing",
    })
    .select("id, access_token, status")
    .single();

  if (insertError || !reportRow) {
    return NextResponse.json({ error: "Failed to save report record" }, { status: 500 });
  }

  return NextResponse.json({
    report_id: reportRow.id,
    access_token: reportRow.access_token,
    status: reportRow.status,
  });
}
