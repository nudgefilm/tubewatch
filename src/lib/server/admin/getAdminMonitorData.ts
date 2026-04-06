import { supabaseAdmin } from "@/lib/supabase/admin";

export type MonitorItem = {
  label: string;
  value: number;
  unit?: string;
  status: "ok" | "warn" | "error";
  description: string;
};

export type AdminMonitorData = {
  checkedAt: string;
  items: MonitorItem[];
};

export async function getAdminMonitorData(): Promise<AdminMonitorData> {
  const now = new Date();
  const minus10m = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const minus30m = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    pendingStuckRes,       // pending 10분+ 초과
    runningStuckRes,       // running 30분+ 초과
    failedModuleRes,       // 최근 24h failed 모듈
    nullScoreRes,          // total_score null
    nullStartedAtRes,      // started_at null (completed 상태)
    completedModuleRes,    // 최근 24h completed 모듈
    totalModuleRes,        // 최근 24h 전체 모듈
  ] = await Promise.all([
    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", minus10m),

    supabaseAdmin
      .from("analysis_runs")
      .select("*", { count: "exact", head: true })
      .eq("status", "running")
      .lt("updated_at", minus30m),

    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", minus24h),

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
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", minus24h),

    supabaseAdmin
      .from("analysis_module_results")
      .select("*", { count: "exact", head: true })
      .gte("created_at", minus24h),
  ]);

  const pendingStuck = pendingStuckRes.count ?? 0;
  const runningStuck = runningStuckRes.count ?? 0;
  const failedModule = failedModuleRes.count ?? 0;
  const nullScore = nullScoreRes.count ?? 0;
  const nullStartedAt = nullStartedAtRes.count ?? 0;
  const completedModule = completedModuleRes.count ?? 0;
  const totalModule = totalModuleRes.count ?? 0;

  const completionRate =
    totalModule > 0 ? Math.round((completedModule / totalModule) * 100) : 100;

  const items: MonitorItem[] = [
    {
      label: "Pending 10분+ 초과",
      value: pendingStuck,
      unit: "건",
      status: pendingStuck === 0 ? "ok" : pendingStuck <= 2 ? "warn" : "error",
      description: "0이 정상. 무한 pending 감지",
    },
    {
      label: "Running 30분+ 초과",
      value: runningStuck,
      unit: "건",
      status: runningStuck === 0 ? "ok" : "error",
      description: "0이 정상. 분석 중단 감지",
    },
    {
      label: "Failed 모듈 (최근 24h)",
      value: failedModule,
      unit: "건",
      status: failedModule === 0 ? "ok" : failedModule <= 3 ? "warn" : "error",
      description: "모듈 실패 누적 여부",
    },
    {
      label: "완료율 (최근 24h)",
      value: completionRate,
      unit: "%",
      status: completionRate >= 90 ? "ok" : completionRate >= 70 ? "warn" : "error",
      description: "분석 요청 대비 완료 비율",
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
    },
  ];

  return {
    checkedAt: now.toISOString(),
    items,
  };
}
