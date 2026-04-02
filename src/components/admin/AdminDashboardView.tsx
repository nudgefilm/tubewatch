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
    <div className="space-y-8">
      <div className="border-b border-foreground/8 pb-5">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">서비스 운영 현황 요약</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AdminStatCard label="Users" value={kpi.usersCount} />
        <AdminStatCard label="Channels" value={kpi.channelsCount} />
        <AdminStatCard label="Analysis Runs" value={kpi.analysisRunsCount} />
        <AdminStatCard label="Failed Jobs" value={kpi.failedJobsCount} variant="danger" />
      </div>

      {/* Recent Queue */}
      <section>
        <AdminQueueTable rows={queueRows} />
      </section>

      {/* Failure Log */}
      <section>
        <AdminFailureTable rows={failureRows} />
      </section>
    </div>
  );
}
