import AdminView from "@/components/admin/AdminView";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";
import { getAdminDashboardData } from "@/lib/server/admin/getAdminDashboardData";

export default async function AdminRoutePage() {
  await ensureAdminOrRedirect();
  const data = await getAdminDashboardData();
  return <AdminView data={data} />;
}
