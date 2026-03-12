import { fetchAdminMetrics } from "@/lib/admin/fetchAdminMetrics";
import type { MetricsKpi } from "@/lib/admin/types";
import MetricsDailyChart from "@/components/admin/MetricsDailyChart";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";

function MetricsKpiGrid({ kpi }: { kpi: MetricsKpi }): JSX.Element {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-500">최근 7일</h3>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="분석 요청" subtitle="최근 7일" value={kpi.requests7d} />
        <KpiCard label="성공" subtitle="최근 7일" value={kpi.success7d} accent="success" />
        <KpiCard label="실패" subtitle="최근 7일" value={kpi.failed7d} accent="danger" />
      </div>

      <h3 className="pt-2 text-xs font-semibold text-gray-500">최근 30일</h3>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="분석 요청" subtitle="최근 30일" value={kpi.requests30d} />
        <KpiCard label="성공" subtitle="최근 30일" value={kpi.success30d} accent="success" />
        <KpiCard label="실패" subtitle="최근 30일" value={kpi.failed30d} accent="danger" />
      </div>
    </div>
  );
}

export default async function AdminMetricsPage(): Promise<JSX.Element> {
  const { kpi, daily } = await fetchAdminMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Metrics</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          일별/주간 운영 지표 추이를 확인합니다.
        </p>
      </div>

      <MetricsKpiGrid kpi={kpi} />

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500">일별 추이 (최근 30일)</h3>
        <SectionCard>
          <MetricsDailyChart data={daily} />
        </SectionCard>
      </div>
    </div>
  );
}
