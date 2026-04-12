import { supabaseAdmin } from "@/lib/supabase/admin";

export type DirectActionKey = "resetStuckPending" | "resetStuckRunning" | "clearStuckQueued";
export type ModalActionKey =
  | "viewFailedJobs"
  | "viewFailedModules"
  | "viewNullScoreChannels"
  | "viewRecentModuleLogs"
  | "testGeminiKey"
  | "viewEnvVars"
  | "viewRecentJobs";

export type MonitorItem = {
  label: string;
  value: number;
  unit?: string;
  displayValue?: string;
  status: "ok" | "warn" | "error";
  description: string;
  buttonLabel: string;
  directAction?: DirectActionKey;
  modalAction?: ModalActionKey;
  extraData?: unknown;
};

export type AdminMonitorData = {
  checkedAt: string;
  items: MonitorItem[];
};

// ── 키 보안 헬퍼 ──────────────────────────────────────────────────────────────

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
    if (res.ok) return { status: "ok", displayValue: "활성", description: "API 키 유효 — 정상 응답" };
    if ([400, 401, 403].includes(res.status)) {
      return { status: "error", displayValue: "비활성", description: `키 무효 또는 비활성화 (HTTP ${res.status}) — 재발급 필요` };
    }
    return { status: "warn", displayValue: "확인불가", description: `API 응답 이상 (HTTP ${res.status}) — 잠시 후 재확인` };
  } catch {
    return { status: "warn", displayValue: "타임아웃", description: "Gemini API 연결 실패 — 네트워크 또는 일시적 오류" };
  }
}

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

function countLeakedPublicEnvVars(): { count: number; leaked: string[] } {
  const sensitiveKeys = ["GEMINI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "YOUTUBE_API_KEY"];
  const leaked = sensitiveKeys.map((k) => `NEXT_PUBLIC_${k}`).filter((k) => !!process.env[k]);
  return { count: leaked.length, leaked };
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

export async function getAdminMonitorData(): Promise<AdminMonitorData> {
  const now = new Date();
  const minus10m = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const minus30m = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const geminiKeyCheckPromise = checkGeminiKeyStatus();

  const [
    pendingStuckRes,
    runningStuckRes,
    failedModuleRes,
    failedRunRes,
    queuedRunRes,
    nullScoreRes,
    avgDurationRes,
    totalJobsRes,
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
  const totalJobs24h = totalJobsRes.count ?? 0;

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

  const envIssueCount = missingEnvCount + leakedCount;

  const items: MonitorItem[] = [
    {
      label: "지연/중단 작업",
      value: runningStuck,
      unit: "건",
      status: runningStuck === 0 ? "ok" : "error",
      description: "Running 30분+ 초과 — 0이 정상",
      buttonLabel: "초기화",
      directAction: "resetStuckRunning",
    },
    {
      label: "대기열 적체",
      value: queuedRun,
      unit: "건",
      status: queuedRun === 0 ? "ok" : queuedRun <= 3 ? "warn" : "error",
      description: "Queued 잔존 — 0이 정상",
      buttonLabel: "대기열 비우기",
      directAction: "clearStuckQueued",
    },
    {
      label: "장기 미처리 요청",
      value: pendingStuck,
      unit: "건",
      status: pendingStuck === 0 ? "ok" : pendingStuck <= 2 ? "warn" : "error",
      description: "Pending 10분+ 초과 — 0이 정상",
      buttonLabel: "재시도",
      directAction: "resetStuckPending",
    },
    {
      label: "분석 실패 감지",
      value: failedRun,
      unit: "건",
      status: failedRun === 0 ? "ok" : failedRun <= 2 ? "warn" : "error",
      description: "최근 24시간 실패 런 — 0이 정상",
      buttonLabel: "실패 로그 보기",
      modalAction: "viewFailedJobs",
    },
    {
      label: "데이터 저장 누락",
      value: nullScore,
      unit: "건",
      status: nullScore === 0 ? "ok" : nullScore <= 5 ? "warn" : "error",
      description: "total_score null — 0이 정상",
      buttonLabel: "재처리",
      modalAction: "viewNullScoreChannels",
    },
    {
      label: "분석 성능 이상",
      value: avgDurationSec,
      unit: "초",
      status: avgDurationSec <= 10 ? "ok" : avgDurationSec <= 60 ? "warn" : "error",
      description: "평균 분석 소요 — 기준: 10초 이하 정상",
      buttonLabel: "최근 실행 로그",
      modalAction: "viewRecentModuleLogs",
    },
    {
      label: "API 상태 이상",
      value: 0,
      displayValue: geminiKey.displayValue,
      status: geminiKey.status,
      description: `Gemini API — ${geminiKey.description}`,
      buttonLabel: "연결 테스트",
      modalAction: "testGeminiKey",
    },
    {
      label: "환경 설정 이상",
      value: envIssueCount,
      unit: "개",
      status: envIssueCount === 0 ? "ok" : "error",
      description:
        envIssueCount === 0
          ? "필수 환경변수 정상"
          : [
              missingEnvCount > 0 ? `누락 ${missingEnvCount}개` : "",
              leakedCount > 0 ? `노출 ${leakedCount}개` : "",
            ]
              .filter(Boolean)
              .join(", "),
      buttonLabel: "설정 확인",
      modalAction: "viewEnvVars",
      extraData: { missing: missingEnvList, leaked: leakedList },
    },
    {
      label: "분석 정지 감지",
      value: totalJobs24h,
      unit: "건",
      status: "ok",
      description: "최근 24시간 총 분석수",
      buttonLabel: "최근 작업 보기",
      modalAction: "viewRecentJobs",
    },
    {
      label: "모듈 단위 실패",
      value: failedModule,
      unit: "건",
      status: failedModule === 0 ? "ok" : failedModule <= 3 ? "warn" : "error",
      description: "최근 24시간 실패 모듈 — 0이 정상",
      buttonLabel: "실패 상세 보기",
      modalAction: "viewFailedModules",
    },
  ];

  return { checkedAt: now.toISOString(), items };
}
