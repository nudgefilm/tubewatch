import AdminMonitorView from "@/components/admin/AdminMonitorView";
import { getAdminMonitorData } from "@/lib/server/admin/getAdminMonitorData";

export const dynamic = "force-dynamic";

export default async function AdminMonitorPage() {
  const data = await getAdminMonitorData();
  return <AdminMonitorView data={data} />;
}
