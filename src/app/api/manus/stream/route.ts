export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro — 최대 5분

import { supabaseAdmin } from "@/lib/supabase/admin";
import { streamReport, parseReportJson } from "@/lib/claude/reportClient";
import { buildReportPayload } from "@/lib/manus/prompt";
import type { NormalizedVideo } from "@/lib/analysis/engine/types";

// GET /api/manus/stream?token=<access_token>
// SSE — 진행 이벤트를 스트리밍하고 완료 시 DB 저장
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get("token");

  if (!accessToken) {
    return new Response("token required", { status: 400 });
  }

  const encoder = new TextEncoder();
  let lockInterval: ReturnType<typeof setInterval> | null = null;
  let reportId: string | null = null;

  const send = (controller: ReadableStreamDefaultController, data: object) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 리포트 조회
        const { data: report } = await supabaseAdmin
          .from("manus_reports")
          .select("id, status, user_id, user_channel_id, snapshot_id, created_at, updated_at")
          .eq("access_token", accessToken)
          .maybeSingle();

        if (!report) {
          send(controller, { type: "error", message: "리포트를 찾을 수 없습니다." });
          controller.close();
          return;
        }

        reportId = report.id;

        // 이미 완료된 경우 즉시 반환
        if (report.status === "completed") {
          send(controller, { type: "done" });
          controller.close();
          return;
        }

        if (report.status === "failed") {
          send(controller, { type: "error", message: "리포트 생성에 실패했습니다." });
          controller.close();
          return;
        }

        // 락 체크 — 다른 요청이 이미 실행 중인지 확인
        const createdMs = new Date(report.created_at).getTime();
        const updatedMs = new Date(report.updated_at).getTime();
        const isLocked = (updatedMs - createdMs) > 10_000 && (Date.now() - updatedMs) < 90_000;

        if (isLocked) {
          // 폴링 모드: 기존 실행이 끝날 때까지 5초마다 DB 확인
          send(controller, { type: "progress", message: "분석이 진행 중입니다..." });
          const pollStart = Date.now();
          while (Date.now() - pollStart < 280_000) {
            await new Promise<void>((resolve) => setTimeout(resolve, 5000));
            const { data: latest } = await supabaseAdmin
              .from("manus_reports")
              .select("status")
              .eq("id", report.id)
              .single();
            if (latest?.status === "completed") {
              send(controller, { type: "done" });
              controller.close();
              return;
            }
            if (latest?.status === "failed") {
              send(controller, { type: "error", message: "리포트 생성에 실패했습니다." });
              controller.close();
              return;
            }
            send(controller, { type: "progress", message: "분석이 진행 중입니다..." });
          }
          send(controller, { type: "error", message: "시간 초과" });
          controller.close();
          return;
        }

        // 락 획득
        await supabaseAdmin
          .from("manus_reports")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", report.id);

        // 60초마다 락 갱신 (process route가 가로채지 않도록)
        lockInterval = setInterval(async () => {
          await supabaseAdmin
            .from("manus_reports")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", report.id);
        }, 60_000);

        send(controller, { type: "progress", message: "채널 데이터 로드 중..." });

        // 채널 + 분석 데이터 조회
        const { data: channel } = await supabaseAdmin
          .from("user_channels")
          .select("channel_title, channel_id, subscriber_count, view_count, video_count, description, published_at")
          .eq("id", report.user_channel_id)
          .eq("user_id", report.user_id)
          .maybeSingle();

        const { data: result } = await supabaseAdmin
          .from("analysis_results")
          .select("id, feature_snapshot")
          .eq("id", report.snapshot_id)
          .maybeSingle();

        if (!channel || !result) {
          await supabaseAdmin
            .from("manus_reports")
            .update({ status: "failed", error_message: "채널 또는 분석 데이터를 찾을 수 없습니다." })
            .eq("id", report.id);
          send(controller, { type: "error", message: "채널 데이터를 찾을 수 없습니다." });
          controller.close();
          return;
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

        send(controller, { type: "progress", message: "튜브워치 분석 시작.." });

        // 스트리밍 생성
        let fullText = "";
        let charCount = 0;
        const EXPECTED_CHARS = 18000; // ~6000 토큰 × 3 chars/token

        for await (const chunk of streamReport(payload)) {
          fullText += chunk;
          charCount += chunk.length;
          // 2000자마다 진행률 전송
          if (charCount % 2000 < chunk.length) {
            const pct = Math.min(95, Math.round((charCount / EXPECTED_CHARS) * 100));
            send(controller, { type: "progress", message: `리포트 작성 중... (${pct}%)` });
          }
        }

        // JSON 파싱 & 저장
        const resultJson = parseReportJson(fullText);
        await supabaseAdmin
          .from("manus_reports")
          .update({ status: "completed", result_json: resultJson, error_message: null })
          .eq("id", report.id);

        send(controller, { type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (reportId) {
          await supabaseAdmin
            .from("manus_reports")
            .update({ status: "failed", error_message: message })
            .eq("id", reportId);
        }
        send(controller, { type: "error", message });
      } finally {
        if (lockInterval) clearInterval(lockInterval);
        controller.close();
      }
    },
    cancel() {
      if (lockInterval) clearInterval(lockInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
