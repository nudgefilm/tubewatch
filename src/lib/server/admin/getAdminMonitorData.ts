import { supabaseAdmin } from "@/lib/supabase/admin";

export type MonitorItem = {
  label: string;
  value: number;
  unit?: string;
  displayValue?: string;   // 숫자 대신 표시할 텍스트 (키 상태 등)
  status: "ok" | "warn" | "error";
  description: string;
  /** 정리 버튼을 연결할 Server Action 식별자 */
  actionKey?: "cleanupNullStartedAt" | "normalizeJobStatusSuccess" | "resetStuckPending";
};

export type AdminMonitorData = {
  checkedAt: string;
  items: MonitorItem[];
};

// ── 키 보안 헬퍼 ──────────────────────────────────────────────────────────────

/** Gemini API 키 활성 여부 — models 목록 조회(GET, 무과금)로 확인 */
async function checkGeminiKeyStatus(): Promise<{
  status: "ok" | "warn" | "error";
  displayValue: string;
  description: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: "error", displayValue: "키 없음", description: "GEMINI_API_KEY 미설정" };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      return { status: "ok", displayValue: "활성", description: "API 키 유효 — 정상 응답" };
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { status: "error", displayValue: "비활성", description: `키 무효 또는 비활성화 (HTTP ${res.status}) — 재발급 필요` };
    }
    return { status: "warn", displayValue: "확인불가", description: `API 응답 이상 (HTTP ${res.status}) — 잠시 후 재확인` };
  } catch {
    return { status: "warn", displayValue: "타임아웃", description: "Gemini API 연결 실패 — 네트워크 또는 일시적 오류" };
  }
}

/** 필수 환경변수 누락 수 */
function countMissingEnvVars(): { count: number; missing: string[] } {
  const required = [
    "GEMINI_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  return { count: missing.length, missing };
}

/**
 * 민감 키가 NEXT_PUBLIC_ 로 실수 노출됐는지 확인.
 * NEXT_PUBLIC_ 변수는 클라이언트 번들에 포함돼 브라우저에서 노출됨.
 */
function countLeakedPublicEnvVars(): { count: number; leaked: string[] } {
  const sensitiveKeys = ["GEMINI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "YOUTUBE_API_KEY"];
  const leaked = sensitiveKeys
    .map((k) => `NEXT_PUBLIC_${k}`)
    .filter((k) => !!process.env[k]);
  return { count: leaked.length, leaked };
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

export async function getAdminMonitorData(): Promise<AdminMonitorData> {
  const now = new Date();
  const minus10m = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const minus30m = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // 키 보안 체크 (DB 쿼리와 병렬)
  const geminiKeyCheckPromise = checkGeminiKeyStatus();

  const [
    pendingStuckRes,       // pending 10분+ 초과
    runningStuckRes,       // running 30분+ 초과
    failedModuleRes,       // 최근 24h failed 모듈
    failedRunRes,          // 최근 24h failed 런
    queuedRunRes,          // 현재 queued 런
    nullScoreRes,          // total_score null
    nullStartedAtRes,      // started_at null (completed 상태)
    legacySuccessJobsRes,  // analysis_jobs.status = "success" 레거시 건수
    completedModuleRes,    // 최근 24h completed 모듈
    totalModuleRes,        // 최근 24h 전체 모듈
    avgDurationRes,        // 최근 24h 평균 소요 시간
    totalJobsRes,          // 최근 24h 총 분석 요청 수
  ] = await Promise.all([
    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", minus10m),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "running")
      .lt("started_at", minus30m),

    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", minus24h),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", minus24h),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued"),

    supabaseAdmin
      .from("analysis_results")
      .select("*", { count: "exact", head: true })
      .is("total_score", null),

    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .is("started_at", null),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "success"),

    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", minus24h),

    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .gte("created_at", minus24h),

    supabaseAdmin
      .from("analysis_module_results")
      .select("started_at, analyzed_at")
      .eq("status", "completed")
      .not("started_at", "is", null)
      .not("analyzed_at", "is", null)
      .gte("created_at", minus24h),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", minus24h),
  ]);

  const geminiKey = await geminiKeyCheckPromise;
  const { count: missingEnvCount, missing: missingEnvList } = countMissingEnvVars();
  const { count: leakedCount, leaked: leakedList } = countLeakedPublicEnvVars();

  const pendingStuck = pendingStuckRes.count ?? 0;
  const runningStuck = runningStuckRes.count ?? 0;
  const failedModule = failedModuleRes.count ?? 0;
  const failedRun = failedRunRes.count ?? 0;
  const queuedRun = queuedRunRes.count ?? 0;
  const nullScore = nullScoreRes.count ?? 0;
  const nullStartedAt = nullStartedAtRes.count ?? 0;
  const legacySuccessJobs = legacySuccessJobsRes.count ?? 0;
  const completedModule = completedModuleRes.count ?? 0;
  const totalModule = totalModuleRes.count ?? 0;
  const totalJobs24h = totalJobsRes.count ?? 0;

  // 평균 분석 소요 시간 계산 (초 단위)
  let avgDurationSec = 0;
  const durationRows = avgDurationRes.data ?? [];
  if (durationRows.length > 0) {
    const totalMs = durationRows.reduce((sum, row) => {
      const start = new Date(row.started_at as string).getTime();
      const end = new Date(row.analyzed_at as string).getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    avgDurationSec = Math.round(totalMs / durationRows.length / 1000);
  }

  const completionRate =
    totalModule > 0 ? Math.round((completedModule / totalModule) * 100) : 100;

  const items: MonitorItem[] = [
    {
      label: "Pending 10분+ 초과",
      value: pendingStuck,
      unit: "건",
      status: pendingStuck === 0 ? "ok" : pendingStuck <= 2 ? "warn" : "error",
      description: "0이 정상. 서버점검사항",
      actionKey: "resetStuckPending",
    },
    {
      label: "Running 30분+ 초과",
      value: runningStuck,
      unit: "건",
      status: runningStuck === 0 ? "ok" : "error",
      description: "0이 정상. 분석 중단 감지",
    },
    {
      label: "Queued 대기",
      value: queuedRun,
      unit: "건",
      status: queuedRun <= 3 ? "ok" : queuedRun <= 10 ? "warn" : "error",
      description: "비정상 queued 잔존 여부 (0이 정상)",
    },
    {
      label: "지난 24시간 총 분석수",
      value: totalJobs24h,
      unit: "건",
      status: "ok",
      description: "최근 24h 동안 요청된 총 채널분석 횟수",
    },
    {
      label: "Failed 런 (최근 24h)",
      value: failedRun,
      unit: "건",
      status: failedRun === 0 ? "ok" : failedRun <= 2 ? "warn" : "error",
      description: "런 전체 실패 여부",
    },
    {
      label: "Failed 모듈 (최근 24h)",
      value: failedModule,
      unit: "건",
      status: failedModule === 0 ? "ok" : failedModule <= 3 ? "warn" : "error",
      description: "모듈 단위 실패 누적 여부",
    },
    {
      label: "완료율 (최근 24h)",
      value: completionRate,
      unit: "%",
      status: completionRate >= 90 ? "ok" : completionRate >= 70 ? "warn" : "error",
      description: "분석 요청 대비 완료 비율",
    },
    {
      label: "평균 분석 소요",
      value: avgDurationSec,
      unit: "초",
      status: avgDurationSec <= 60 ? "ok" : avgDurationSec <= 180 ? "warn" : "error",
      description: "최근 24h 모듈 평균 처리 시간",
    },
    {
      label: "total_score null",
      value: nullScore,
      unit: "건",
      status: nullScore === 0 ? "ok" : nullScore <= 5 ? "warn" : "error",
      description: "분석 결과 저장 누락 여부",
    },
    {
      label: "started_at null (completed)",
      value: nullStartedAt,
      unit: "건",
      status: nullStartedAt === 0 ? "ok" : "warn",
      description: "레거시 데이터 잔존 여부",
      actionKey: "cleanupNullStartedAt",
    },
    {
      label: "분석 완료 status=success 잔존",
      value: legacySuccessJobs,
      unit: "건",
      status: legacySuccessJobs === 0 ? "ok" : "warn",
      description: "버그로 인해 completed 대신 success로 저장된 채널분석 횟수 누락 원인",
      actionKey: "normalizeJobStatusSuccess",
    },
    // ── 키 보안 ────────────────────────────────────────────────
    {
      label: "Gemini API 키 활성",
      value: 0,
      displayValue: geminiKey.displayValue,
      status: geminiKey.status,
      description: geminiKey.description,
    },
    {
      label: "필수 환경변수 누락",
      value: missingEnvCount,
      unit: "개",
      status: missingEnvCount === 0 ? "ok" : "error",
      description:
        missingEnvCount === 0
          ? "모든 필수 환경변수 설정됨"
          : `누락: ${missingEnvList.join(", ")}`,
    },
    {
      label: "민감 키 NEXT_PUBLIC 노출",
      value: leakedCount,
      unit: "개",
      status: leakedCount === 0 ? "ok" : "error",
      description:
        leakedCount === 0
          ? "[해킹]설정 노출 여부"
          : `노출된 키: ${leakedList.join(", ")} — 즉시 조치`,
    },
  ];

  return {
    checkedAt: now.toISOString(),
    items,
  };
}
