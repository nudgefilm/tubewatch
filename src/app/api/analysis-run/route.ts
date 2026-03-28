/**
 * 메뉴별 확장 run 생성 — 베이스 `analysis_results.id` 를 `input_snapshot_id` 로만 연결하고,
 * 메뉴별 파생 본문은 저장하지 않는다. 정책: `menuExtensionDataStrategy`.
 */
import { NextResponse } from "next/server";
import { buildYoutubeFeatureAccessSnapshot } from "@/lib/auth/featureAccess";
import {
  createAnalysisRun,
  parseAnalysisRunRow,
  parseExtensionAnalysisRunRequestBody,
  type AnalysisRunRecord,
  updateAnalysisRunStatusInDb,
} from "@/lib/analysis/analysisRun";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateUserCredits,
  incrementCreditsUsed,
} from "@/lib/server/analysis/checkUserCredits";
import { insertCreditLog } from "@/lib/server/analysis/creditLog";
import { insertAnalysisModuleResults } from "@/lib/server/analysis/moduleResults";

function analysisRunToResponseBody(r: AnalysisRunRecord) {
  return {
    id: r.id,
    userId: r.userId,
    channelId: r.channelId,
    analysisType: r.analysisType,
    status: r.status,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    updatedAt: r.updatedAt,
    inputSnapshotId: r.inputSnapshotId,
    resultSnapshotId: r.resultSnapshotId,
    errorMessage: r.errorMessage,
  };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const parsed = parseExtensionAnalysisRunRequestBody(json);
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "channelId 또는 analysisType이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const yt = await buildYoutubeFeatureAccessSnapshot();
  if (!yt.canUseCoreAnalysisFeatures) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "관리 가능한 YouTube 채널 확인 후 메뉴별 분석을 실행할 수 있습니다.",
      },
      { status: 403 }
    );
  }

  const { data: channelRow, error: chErr } = await supabase
    .from("user_channels")
    .select("id")
    .eq("id", parsed.channelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (chErr) {
    console.error("[analysis-run] user_channels", chErr);
    return NextResponse.json(
      { ok: false, error: "채널 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  if (!channelRow) {
    return NextResponse.json(
      { ok: false, error: "해당 채널을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { data: latestResult, error: lrErr } = await supabase
    .from("analysis_results")
    .select("*")  // STEP 7: 전체 필드 필요 (module payload 구성용)
    .eq("user_id", user.id)
    .eq("user_channel_id", parsed.channelId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lrErr) {
    console.error("[analysis-run] analysis_results", lrErr);
    return NextResponse.json(
      { ok: false, error: "베이스 분석 조회에 실패했습니다." },
      { status: 500 }
    );
  }

  if (!latestResult || typeof latestResult.id !== "string") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "저장된 베이스 분석이 없습니다. 먼저 채널 분석을 완료한 뒤 다시 시도하세요.",
      },
      { status: 409 }
    );
  }

  const inserted = await createAnalysisRun(supabase, {
    userId: user.id,
    channelId: parsed.channelId,
    analysisType: parsed.analysisType,
    inputSnapshotId: latestResult.id,
    runType: parsed.runType,
    requestedModules: parsed.requestedModules,
  });

  if (!inserted) {
    return NextResponse.json(
      { ok: false, error: "분석 run 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  const toRunning = await updateAnalysisRunStatusInDb(supabase, {
    runId: inserted.id,
    userId: user.id,
    patch: { status: "running" },
  });

  if (!toRunning) {
    await updateAnalysisRunStatusInDb(supabase, {
      runId: inserted.id,
      userId: user.id,
      patch: {
        status: "failed",
        errorMessage: "running 상태로 전환하지 못했습니다.",
      },
    });
    return NextResponse.json(
      { ok: false, error: "run 상태 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }

  const toCompleted = await updateAnalysisRunStatusInDb(supabase, {
    runId: inserted.id,
    userId: user.id,
    patch: { status: "completed" },
  });

  if (!toCompleted) {
    await updateAnalysisRunStatusInDb(supabase, {
      runId: inserted.id,
      userId: user.id,
      patch: {
        status: "failed",
        errorMessage: "completed 상태로 전환하지 못했습니다.",
      },
    });
    return NextResponse.json(
      { ok: false, error: "run 완료 처리에 실패했습니다." },
      { status: 500 }
    );
  }

  // STEP 7: analysis_module_results 저장 (run 완료 후, non-fatal)
  // requested_modules 기준 1 module = 1 row. 개별 실패는 로그로 추적.
  const moduleAnalyzedAt = new Date().toISOString();
  try {
    await insertAnalysisModuleResults(supabase, {
      analysisRunId: inserted.id,
      userId: user.id,
      channelId: parsed.channelId,
      snapshotId: latestResult.id as string,
      requestedModules: parsed.requestedModules,
      resultRow: latestResult as Record<string, unknown>,
      analyzedAt: moduleAnalyzedAt,
    });
  } catch (moduleErr) {
    console.error("[analysis-run] module results insertion error:", moduleErr);
  }

  // STEP 5: credit 차감 + credit_logs 1행 기록 (run 완료 후)
  // non-fatal — credit 기록 실패가 run 응답을 막지 않음
  try {
    const creditsBefore = await getOrCreateUserCredits(supabase, user.id);
    const creditBefore = creditsBefore.credits_used;

    try {
      await incrementCreditsUsed(supabase, user.id);
      await insertCreditLog(supabase, {
        userId: user.id,
        channelId: parsed.channelId,
        snapshotId: latestResult.id,
        analysisRunId: inserted.id,
        runType: parsed.runType,
        requestedModules: parsed.requestedModules,
        creditBefore,
        creditDelta: -1,
        resultStatus: "applied",
      });
    } catch (incrementErr) {
      console.error("[analysis-run] credit increment failed:", incrementErr);
      await insertCreditLog(supabase, {
        userId: user.id,
        channelId: parsed.channelId,
        snapshotId: latestResult.id,
        analysisRunId: inserted.id,
        runType: parsed.runType,
        requestedModules: parsed.requestedModules,
        creditBefore,
        creditDelta: 0,
        resultStatus: "failed",
        failureReason:
          incrementErr instanceof Error
            ? incrementErr.message
            : "credit increment failed",
      });
    }
  } catch (creditErr) {
    console.error("[analysis-run] credit flow failed:", creditErr);
  }

  const { data: finalRow, error: finalErr } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("id", inserted.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (finalErr) {
    console.error("[analysis-run] final select", finalErr);
  }

  const finalRec = parseAnalysisRunRow(finalRow) ?? inserted;

  return NextResponse.json({
    ok: true,
    run: analysisRunToResponseBody(finalRec),
  });
}
