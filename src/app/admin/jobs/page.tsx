import { Suspense } from "react";
import { fetchAdminJobs } from "@/lib/admin/fetchAdminJobs";
import { formatDateTime } from "@/lib/format/formatDateTime";
import type { AdminJobRow, JobStatusFilter } from "@/lib/admin/types";
import JobStatusFilterBar from "@/components/admin/JobStatusFilter";
import AdminStatusBadge from "@/components/ui/AdminStatusBadge";
import EmptyState from "@/components/ui/EmptyState";

function DurationCell({
  start,
  end,
}: {
  start: string | null;
  end: string | null;
}): JSX.Element {
  if (!start || !end) return <span className="text-gray-300">—</span>;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return <span className="text-gray-300">—</span>;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return <span>{sec}s</span>;
  const min = Math.floor(sec / 60);
  const remain = sec % 60;
  return (
    <span>
      {min}m {remain}s
    </span>
  );
}

function JobsTable({ jobs }: { jobs: AdminJobRow[] }): JSX.Element {
  if (jobs.length === 0) {
    return <EmptyState dashed message="해당 조건의 작업이 없습니다." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <th className="px-4 py-2.5 font-medium">Job ID</th>
            <th className="px-4 py-2.5 font-medium">사용자</th>
            <th className="px-4 py-2.5 font-medium">채널</th>
            <th className="px-4 py-2.5 font-medium">상태</th>
            <th className="px-4 py-2.5 font-medium">생성일</th>
            <th className="px-4 py-2.5 font-medium">시작일</th>
            <th className="px-4 py-2.5 font-medium">완료일</th>
            <th className="px-4 py-2.5 font-medium">소요</th>
            <th className="px-4 py-2.5 font-medium">에러</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {jobs.map((job) => (
            <tr key={job.id} className="transition hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-gray-600">
                {job.id.slice(0, 8)}…
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                {job.user_email}
              </td>
              <td
                className="max-w-[140px] truncate px-4 py-2.5 text-gray-500"
                title={job.channel_title ?? undefined}
              >
                {job.channel_title ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <AdminStatusBadge status={job.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-500">
                {formatDateTime(job.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-400">
                {formatDateTime(job.started_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-400">
                {formatDateTime(job.finished_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-400">
                <DurationCell start={job.started_at} end={job.finished_at} />
              </td>
              <td
                className="max-w-[200px] truncate px-4 py-2.5 text-gray-400"
                title={job.error_message ?? undefined}
              >
                {job.error_message ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const VALID_STATUSES = new Set(["queued", "running", "success", "failed"]);

function parseStatusFilter(raw: string | string[] | undefined): JobStatusFilter {
  const value = typeof raw === "string" ? raw : undefined;
  if (value && VALID_STATUSES.has(value)) return value as JobStatusFilter;
  return "all";
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  const statusFilter = parseStatusFilter(searchParams.status);
  const { jobs, totalCount } = await fetchAdminJobs(statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Jobs</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          분석 작업 목록 및 상태를 확인합니다. 최근 50건을 표시합니다.
        </p>
      </div>

      <Suspense fallback={null}>
        <JobStatusFilterBar totalCount={totalCount} />
      </Suspense>

      <JobsTable jobs={jobs} />
    </div>
  );
}
