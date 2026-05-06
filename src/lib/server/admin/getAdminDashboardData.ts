import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminDashboardData,
  AdminDashboardKpi,
  AdminQueueRow,
  AdminFailureRow,
  TrafficDayRow,
} from "@/components/admin/types";

type JobDbRow = {
  id: string;
  user_channel_id: string;
  status: string;
  created_at: string | null;
};

type FailureDbRow = {
  channel_title: string | null;
  created_at: string | null;
  gemini_raw_json: string | null;
};

function truncateError(raw: string | null, maxLen: number): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + "…";
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const KST = 9 * 60 * 60 * 1000;
  const todayKST = new Date(Date.now() + KST).toISOString().slice(0, 10);
  const tomorrowKST = new Date(Date.now() + KST + 86_400_000).toISOString().slice(0, 10);
  const thirtyDaysAgoKST = new Date(Date.now() + KST - 30 * 86_400_000).toISOString().slice(0, 10);
  // KST 자정 기준 UTC 타임스탬프 (timestamptz 컬럼 범위 쿼리용)
  const todayKSTStart = `${todayKST}T00:00:00+09:00`;
  const tomorrowKSTStart = `${tomorrowKST}T00:00:00+09:00`;

  const [
    usersCountRes,
    channelsCountRes,
    todayAnalysisRes,
    todayFailedJobsRes,
    activeSubsRes,
    jobsRes,
    failuresRes,
    todayVisitorsRes,
    todaySignupsRes,
    todayWithdrawalsRes,
    todayPaymentsRes,
    consultingTodayRes,
    consultingTotalRes,
    trafficRes,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    supabaseAdmin.from("user_channels").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("analysis_results")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayKSTStart)
      .lt("created_at", tomorrowKSTStart),
    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", todayKSTStart)
      .lt("created_at", tomorrowKSTStart),
    supabaseAdmin
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .in("subscription_status", ["active", "trialing"]),
    supabaseAdmin
      .from("analysis_jobs")
      .select("id, user_channel_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("analysis_results")
      .select("channel_title, created_at, gemini_raw_json")
      .eq("gemini_status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("site_visits")
      .select("*", { count: "exact", head: true })
      .eq("visit_date", todayKST),
    supabaseAdmin
      .from("user_signup_log")
      .select("*", { count: "exact", head: true })
      .gte("joined_at", todayKSTStart)
      .lt("joined_at", tomorrowKSTStart),
    supabaseAdmin
      .from("user_signup_log")
      .select("*", { count: "exact", head: true })
      .gte("withdrawn_at", todayKSTStart)
      .lt("withdrawn_at", tomorrowKSTStart),
    supabaseAdmin
      .from("subscription_changes")
      .select("*", { count: "exact", head: true })
      .in("change_type", ["new", "upgrade"])
      .gte("changed_at", todayKSTStart)
      .lt("changed_at", tomorrowKSTStart),
    supabaseAdmin
      .from("b2c_consulting_inquiries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayKSTStart)
      .lt("created_at", tomorrowKSTStart),
    supabaseAdmin
      .from("b2c_consulting_inquiries")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("site_visits")
      .select("visit_date")
      .gte("visit_date", thirtyDaysAgoKST)
      .lte("visit_date", todayKST)
      .order("visit_date", { ascending: true }),
  ]);

  const kpi: AdminDashboardKpi = {
    usersCount: (usersCountRes.data as { total?: number } | null)?.total ?? 0,
    channelsCount: channelsCountRes.count ?? 0,
    todayAnalysisCount: todayAnalysisRes.count ?? 0,
    todayFailedCount: todayFailedJobsRes.count ?? 0,
    activeSubscribersCount: activeSubsRes.count ?? 0,
    todayVisitorsCount: todayVisitorsRes.count ?? 0,
    todaySignupsCount: todaySignupsRes.count ?? 0,
    todayWithdrawalsCount: todayWithdrawalsRes.count ?? 0,
    todayPaymentsCount: todayPaymentsRes.count ?? 0,
    consultingTodayCount: consultingTodayRes.count ?? 0,
    consultingTotalCount: consultingTotalRes.count ?? 0,
  };

  const jobData = (jobsRes.data ?? []) as unknown as JobDbRow[];
  const channelIds = Array.from(
    new Set(jobData.map((r) => r.user_channel_id).filter(Boolean))
  );

  const channelTitleMap = new Map<string, string>();
  if (channelIds.length > 0) {
    const { data: channelRows } = await supabaseAdmin
      .from("user_channels")
      .select("id, channel_title")
      .in("id", channelIds);

    for (const row of (channelRows ?? []) as { id: string; channel_title: string | null }[]) {
      channelTitleMap.set(row.id, row.channel_title ?? "—");
    }
  }

  const queueRows: AdminQueueRow[] = jobData.map((r) => ({
    job_id: r.id,
    channel: r.user_channel_id ? channelTitleMap.get(r.user_channel_id) ?? null : null,
    status: r.status,
    created_at: r.created_at,
  }));

  const failureData = (failuresRes.data ?? []) as unknown as FailureDbRow[];
  const failureRows: AdminFailureRow[] = failureData.map((r) => ({
    channel: r.channel_title,
    error: truncateError(r.gemini_raw_json, 120),
    created_at: r.created_at,
  }));

  // 날짜별 방문자 수 집계 (site_visits 1행 = 1 unique visitor/day)
  const visitMap = new Map<string, number>();
  for (const row of (trafficRes.data ?? []) as { visit_date: string }[]) {
    visitMap.set(row.visit_date, (visitMap.get(row.visit_date) ?? 0) + 1);
  }
  const trafficRows: TrafficDayRow[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() + KST - (29 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { date, visitors: visitMap.get(date) ?? 0 };
  });

  return { kpi, queueRows, failureRows, trafficRows };
}
