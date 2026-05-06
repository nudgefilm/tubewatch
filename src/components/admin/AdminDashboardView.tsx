import type { AdminDashboardData } from "./types";
import AdminStatCard from "./AdminStatCard";
import AdminQueueTable from "./AdminQueueTable";
import AdminFailureTable from "./AdminFailureTable";
import TrafficChart from "./TrafficChart";

type AdminDashboardViewProps = {
  data: AdminDashboardData;
};

export default function AdminDashboardView({
  data,
}: AdminDashboardViewProps): JSX.Element {
  const { kpi, queueRows, failureRows, trafficRows } = data;

  return (
    <div className="space-y-8">
      <div className="border-b border-foreground/8 pb-5">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">
          대시보드
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">서비스 운영 현황 요약</p>
      </div>

      {/* 사용자 */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">사용자</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AdminStatCard label="전체 유저" value={kpi.usersCount} />
          <AdminStatCard label="유료 구독자" value={kpi.activeSubscribersCount} variant="highlight" />
          <AdminStatCard label="오늘 가입" value={kpi.todaySignupsCount} variant="success" />
          <AdminStatCard label="오늘 탈퇴" value={kpi.todayWithdrawalsCount} />
        </div>
      </section>

      {/* 오늘 현황 */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">오늘 현황</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AdminStatCard label="분석 요청" value={kpi.todayAnalysisCount} />
          <AdminStatCard label="실패 잡" value={kpi.todayFailedCount} variant="danger" />
          <AdminStatCard label="접속수" value={kpi.todayVisitorsCount} />
          <AdminStatCard label="결제수" value={kpi.todayPaymentsCount} variant="highlight" />
        </div>
      </section>

      {/* 서비스 */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">서비스</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AdminStatCard label="등록 채널" value={kpi.channelsCount} />
          <AdminStatCard
            label="컨설팅 주문"
            value={kpi.consultingTodayCount}
            subtitle="오늘"
            secondary={`누적 ${kpi.consultingTotalCount.toLocaleString("ko-KR")}건`}
            variant="highlight"
          />
        </div>
      </section>

      {/* Recent Queue */}
      <section>
        <AdminQueueTable rows={queueRows} />
      </section>

      {/* Failure Log */}
      <section>
        <AdminFailureTable rows={failureRows} />
      </section>

      {/* Traffic Chart */}
      <section>
        <TrafficChart data={trafficRows} />
      </section>
    </div>
  );
}
