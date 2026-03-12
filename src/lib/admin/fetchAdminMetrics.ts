import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminMetricsData, MetricsKpi, DailyMetricRow } from "./types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type JobRow = {
  status: string;
  created_at: string | null;
};

function toKstDateString(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date(Date.now() + KST_OFFSET_MS);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

export async function fetchAdminMetrics(): Promise<AdminMetricsData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: rawJobs } = await supabaseAdmin
    .from("analysis_jobs")
    .select("status, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const jobs = (rawJobs ?? []) as unknown as JobRow[];

  const sevenDaysRange = new Set(buildDateRange(7));
  const thirtyDaysRange = buildDateRange(30);

  let requests7d = 0;
  let success7d = 0;
  let failed7d = 0;

  const dailyMap = new Map<string, { total: number; success: number; failed: number }>();
  for (const date of thirtyDaysRange) {
    dailyMap.set(date, { total: 0, success: 0, failed: 0 });
  }

  for (const job of jobs) {
    if (!job.created_at) continue;
    const dateKey = toKstDateString(job.created_at);

    const bucket = dailyMap.get(dateKey);
    if (bucket) {
      bucket.total += 1;
      if (job.status === "success") bucket.success += 1;
      if (job.status === "failed") bucket.failed += 1;
    }

    if (sevenDaysRange.has(dateKey)) {
      requests7d += 1;
      if (job.status === "success") success7d += 1;
      if (job.status === "failed") failed7d += 1;
    }
  }

  let requests30d = 0;
  let success30d = 0;
  let failed30d = 0;

  const daily: DailyMetricRow[] = thirtyDaysRange.map((date) => {
    const bucket = dailyMap.get(date)!;
    requests30d += bucket.total;
    success30d += bucket.success;
    failed30d += bucket.failed;
    return {
      date,
      total: bucket.total,
      success: bucket.success,
      failed: bucket.failed,
    };
  });

  const kpi: MetricsKpi = {
    requests7d,
    success7d,
    failed7d,
    requests30d,
    success30d,
    failed30d,
  };

  return { kpi, daily };
}
