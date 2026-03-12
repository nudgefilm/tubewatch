import { fetchAdminOverview } from "@/lib/admin/fetchAdminOverview";
import { formatDateTime } from "@/lib/format/formatDateTime";
import type { AdminKpi, RecentJob, RecentUser } from "@/lib/admin/types";
import AdminStatusBadge from "@/components/ui/AdminStatusBadge";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";

function KpiGrid({ kpi }: { kpi: AdminKpi }): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <KpiCard label="총 사용자 수" subtitle="누적" value={kpi.totalUsers} />
      <KpiCard label="총 등록 채널 수" subtitle="누적" value={kpi.totalChannels} />
      <KpiCard label="누적 분석 결과 수" subtitle="누적" value={kpi.totalAnalysisResults} />
      <KpiCard label="최근 7일 분석 요청" subtitle="최근 7일" value={kpi.recentAnalysisRequests7d} />
      <KpiCard label="현재 활성 작업" subtitle="queued + running" value={kpi.activeJobs} accent="warn" />
      <KpiCard label="누적 실패 작업 수" subtitle="전체 기간" value={kpi.failedJobs} accent="danger" />
    </div>
  );
}

function RecentJobsTable({
  title,
  jobs,
}: {
  title: string;
  jobs: RecentJob[];
}): JSX.Element {
  if (jobs.length === 0) {
    return (
      <SectionCard>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-3 text-xs text-gray-400">데이터가 없습니다.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-2 pr-3 font-medium">Job ID</th>
              <th className="pb-2 pr-3 font-medium">사용자</th>
              <th className="pb-2 pr-3 font-medium">채널</th>
              <th className="pb-2 pr-3 font-medium">상태</th>
              <th className="pb-2 pr-3 font-medium">생성일</th>
              <th className="pb-2 font-medium">에러</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="py-2 pr-3 font-mono text-gray-600">
                  {job.id.slice(0, 8)}…
                </td>
                <td className="py-2 pr-3 text-gray-700">
                  {job.user_email}
                </td>
                <td className="max-w-[120px] truncate py-2 pr-3 text-gray-500" title={job.channel_title ?? undefined}>
                  {job.channel_title ?? "—"}
                </td>
                <td className="py-2 pr-3">
                  <AdminStatusBadge status={job.status} />
                </td>
                <td className="py-2 pr-3 whitespace-nowrap tabular-nums text-gray-500">
                  {formatDateTime(job.created_at)}
                </td>
                <td
                  className="max-w-[180px] truncate py-2 text-gray-400"
                  title={job.error_message ?? undefined}
                >
                  {job.error_message ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function RecentUsersTable({ users }: { users: RecentUser[] }): JSX.Element {
  if (users.length === 0) {
    return (
      <SectionCard>
        <h3 className="text-sm font-semibold text-gray-900">최근 가입 사용자</h3>
        <p className="mt-3 text-xs text-gray-400">데이터가 없습니다.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">최근 가입 사용자</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-2 pr-3 font-medium">이메일</th>
              <th className="pb-2 font-medium">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2 pr-3 text-gray-700">{u.email}</td>
                <td className="py-2 whitespace-nowrap tabular-nums text-gray-500">
                  {formatDateTime(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export default async function AdminOverviewPage(): Promise<JSX.Element> {
  const data = await fetchAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Overview</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          TubeWatch 서비스 전체 현황을 한눈에 확인합니다.
        </p>
      </div>

      <KpiGrid kpi={data.kpi} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentJobsTable title="최근 분석 요청" jobs={data.recentJobs} />
        <RecentJobsTable title="최근 실패 작업" jobs={data.recentFailedJobs} />
      </div>

      <RecentUsersTable users={data.recentUsers} />
    </div>
  );
}
