import AdminJobsView from "@/components/admin/AdminJobsView";
import AdminMonitorView from "@/components/admin/AdminMonitorView";
import AdminTabHeader from "@/components/admin/AdminTabHeader";
import { getAdminJobsData } from "@/lib/server/admin/getAdminJobsData";
import { getAdminMonitorData } from "@/lib/server/admin/getAdminMonitorData";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "jobs", label: "분석 작업" },
  { key: "monitor", label: "시스템 모니터" },
];

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "jobs" } = await searchParams;

  return (
    <div className="space-y-6">
      <AdminTabHeader title="파이프라인" tabs={TABS} activeTab={tab} />
      {tab === "monitor" ? (
        <MonitorTab />
      ) : (
        <JobsTab />
      )}
    </div>
  );
}

async function JobsTab() {
  const data = await getAdminJobsData();
  return <AdminJobsView data={data} hideHeader />;
}

async function MonitorTab() {
  const data = await getAdminMonitorData();
  return <AdminMonitorView data={data} hideHeader />;
}
