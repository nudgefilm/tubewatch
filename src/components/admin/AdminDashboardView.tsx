import type { AdminDashboardData } from "./types";
import AdminStatCard from "./AdminStatCard";
import AdminQueueTable from "./AdminQueueTable";
import AdminFailureTable from "./AdminFailureTable";

type AdminDashboardViewProps = {
  data: AdminDashboardData;
};

export default function AdminDashboardView({
  data,
}: AdminDashboardViewProps): JSX.Element {
  const { kpi, queueRows, failureRows } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-0.5 text-xs text-gray-500">운영 상태 요약</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard label="Users" value={kpi.usersCount} />
        <AdminStatCard label="Channels" value={kpi.channelsCount} />
        <AdminStatCard label="Analysis Runs" value={kpi.analysisRunsCount} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          최근 분석 요청
        </h2>
        <AdminQueueTable rows={queueRows} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          분석 실패 로그
        </h2>
        <AdminFailureTable rows={failureRows} />
      </section>
    </div>
  );
}
