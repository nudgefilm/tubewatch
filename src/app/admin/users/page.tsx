import AdminUsersView from "@/components/admin/AdminUsersView";
import { getAdminUsersData } from "@/lib/server/admin/getAdminUsersData";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const data = await getAdminUsersData();
  return <AdminUsersView data={data} />;
}
