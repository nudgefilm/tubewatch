import { getAdminDashboardData } from "@/lib/server/admin/getAdminDashboardData";
import AdminDashboardView from "@/components/admin/AdminDashboardView";

export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const data = await getAdminDashboardData();
  return <AdminDashboardView data={data} />;
}
