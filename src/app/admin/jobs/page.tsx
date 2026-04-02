import AdminJobsView from "@/components/admin/AdminJobsView";
import { getAdminJobsData } from "@/lib/server/admin/getAdminJobsData";

export default async function AdminJobsPage() {
  const data = await getAdminJobsData();
  return <AdminJobsView data={data} />;
}
