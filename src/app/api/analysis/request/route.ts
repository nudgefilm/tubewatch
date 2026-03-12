import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  ANALYSIS_QUEUE_STATUS,
  ANALYSIS_JOB_STATUS,
  ACTIVE_JOB_STATUSES,
} from "@/lib/server/analysis/status";
import { canBypassCooldown } from "@/lib/admin/adminTools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOLDOWN_HOURS = 72;

const ACTIVE_QUEUE_STATUSES = [
  ANALYSIS_QUEUE_STATUS.PENDING,
  ANALYSIS_QUEUE_STATUS.PROCESSING,
];

function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

async function safeReadJsonBody(req: Request): Promise<any> {
  const raw = await req.text();

  if (!raw || raw.trim().length === 0) {
    throw new Error("요청 body가 비어 있습니다.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("요청 JSON 형식이 올바르지 않습니다.");
  }
}

function getRemainingCooldownHours(lastRequestedAt: string | null | undefined) {
  if (!lastRequestedAt) return 0;

  const last = new Date(lastRequestedAt);
  if (Number.isNaN(last.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours >= COOLDOWN_HOURS) return 0;

  return Math.ceil(COOLDOWN_HOURS - diffHours);
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  try {
    const body = await safeReadJsonBody(req);
    const userChannelId = body?.user_channel_id;

    if (!userChannelId || typeof userChannelId !== "string") {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "user_channel_id 필요",
        },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "로그인 필요",
        },
        { status: 401 }
      );
    }

    const { data: channel, error: channelError } = await supabase
      .from("user_channels")
      .select(`
        id,
        user_id,
        channel_id,
        channel_url,
        channel_title,
        last_analyzed_at
      `)
      .eq("id", userChannelId)
      .eq("user_id", user.id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "채널 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    if (!channel.channel_id) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "채널 ID가 비어 있습니다.",
        },
        { status: 400 }
      );
    }

    if (!channel.channel_url) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "채널 URL이 비어 있습니다.",
        },
        { status: 400 }
      );
    }

    const adminBypass = canBypassCooldown(user.email);

    if (!adminBypass) {
      const remainingHours = getRemainingCooldownHours(
        channel.last_analyzed_at
      );

      if (remainingHours > 0) {
        return NextResponse.json(
          {
            success: false,
            ok: false,
            code: "COOLDOWN_ACTIVE",
            error: `현재 쿨다운이 적용 중입니다. 약 ${remainingHours}시간 후 다시 요청할 수 있습니다.`,
            remaining_hours: remainingHours,
          },
          { status: 409 }
        );
      }
    }

    const { data: activeQueueRow, error: activeQueueError } = await supabase
      .from("analysis_queue")
      .select("id, job_id, status")
      .eq("user_id", user.id)
      .eq("user_channel_id", userChannelId)
      .in("status", ACTIVE_QUEUE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeQueueError) {
      throw new Error(
        `analysis_queue active check failed: ${activeQueueError.message}`
      );
    }

    if (activeQueueRow) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          code: "ANALYSIS_ALREADY_ACTIVE",
          error: "이미 진행 중이거나 대기 중인 분석 요청이 있습니다.",
          active_job_id: activeQueueRow.job_id,
          active_status: activeQueueRow.status,
        },
        { status: 409 }
      );
    }

    const { data: activeJobRow, error: activeJobError } = await supabase
      .from("analysis_jobs")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("user_channel_id", userChannelId)
      .in("status", ACTIVE_JOB_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeJobError) {
      throw new Error(
        `analysis_jobs active check failed: ${activeJobError.message}`
      );
    }

    if (activeJobRow) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          code: "ANALYSIS_ALREADY_ACTIVE",
          error: "이미 진행 중이거나 대기 중인 분석 요청이 있습니다.",
          active_job_id: activeJobRow.id,
          active_status: activeJobRow.status,
        },
        { status: 409 }
      );
    }

    const requestedAt = new Date().toISOString();

    const { data: jobRow, error: jobInsertError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: user.id,
        user_channel_id: userChannelId,
        status: ANALYSIS_JOB_STATUS.QUEUED,
        started_at: null,
        finished_at: null,
        error_message: null,
      })
      .select("id, status")
      .single();

    if (jobInsertError || !jobRow) {
      throw new Error(
        `analysis_jobs insert failed: ${
          jobInsertError?.message || "no row returned"
        }`
      );
    }

    console.log("[analysis.request] job created", {
      userId: user.id,
      userChannelId,
      jobId: jobRow.id,
      status: jobRow.status,
    });

    const { data: queueRow, error: queueInsertError } = await supabase
      .from("analysis_queue")
      .insert({
        job_id: jobRow.id,
        user_id: user.id,
        user_channel_id: userChannelId,
        channel_id: channel.channel_id,
        channel_url: channel.channel_url,
        status: ANALYSIS_QUEUE_STATUS.PENDING,
        started_at: null,
        finished_at: null,
        error_message: null,
      })
      .select("id, job_id, status")
      .single();

    if (queueInsertError || !queueRow) {
      await supabase
        .from("analysis_jobs")
        .update({
          status: ANALYSIS_JOB_STATUS.FAILED,
          finished_at: new Date().toISOString(),
          error_message:
            queueInsertError?.message || "analysis_queue insert failed",
        })
        .eq("id", jobRow.id);

      throw new Error(
        `analysis_queue insert failed: ${
          queueInsertError?.message || "no row returned"
        }`
      );
    }

    console.log("[analysis.request] queue created", {
      userId: user.id,
      userChannelId,
      jobId: jobRow.id,
      queueId: queueRow.id,
      queueStatus: queueRow.status,
    });

    const { error: channelUpdateError } = await supabase
      .from("user_channels")
      .update({
        last_analysis_requested_at: requestedAt,
      })
      .eq("id", userChannelId)
      .eq("user_id", user.id);

    if (channelUpdateError) {
      throw new Error(
        `user_channels update failed: ${channelUpdateError.message}`
      );
    }

    let workerTriggered = false;

    try {
      const workerSecret = process.env.WORKER_SECRET;

      if (workerSecret) {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ??
          (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://127.0.0.1:3000");

        const workerResponse = await fetch(
          `${baseUrl}/api/worker/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${workerSecret}`,
            },
          }
        );

        workerTriggered = workerResponse.ok;

        console.log("[analysis.request] worker trigger", {
          status: workerResponse.status,
          ok: workerResponse.ok,
          jobId: jobRow.id,
        });
      }
    } catch (workerError) {
      console.error("[analysis.request] worker trigger failed", {
        jobId: jobRow.id,
        error:
          workerError instanceof Error
            ? workerError.message
            : "unknown",
      });
    }

    return NextResponse.json({
      success: true,
      ok: true,
      message: workerTriggered
        ? "분석 요청이 접수되었습니다. 잠시 후 상태를 확인해 주세요."
        : "분석 요청이 접수되었습니다. 처리까지 약간의 시간이 걸릴 수 있습니다.",
      data: {
        job_id: jobRow.id,
        queue_id: queueRow.id,
        request_id: queueRow.id,
        trace_id: queueRow.id,
        user_channel_id: userChannelId,
        channel_title: channel.channel_title,
        status: queueRow.status,
        worker_triggered: workerTriggered,
      },
    });
  } catch (err: any) {
    console.error("POST /api/analysis/request error:", err);

    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: err.message || "분석 요청 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}