import AdminView from "@/components/admin/AdminView";
import { getAdminDashboardData } from "@/lib/server/admin/getAdminDashboardData";

// auth guard는 layout.tsx에서 처리
export default async function AdminRoutePage() {
  const data = await getAdminDashboardData();
  return <AdminView data={data} />;
}
