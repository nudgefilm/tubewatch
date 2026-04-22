import AdminSignupLogView from "@/components/admin/AdminSignupLogView";
import { getAdminSignupLogData } from "@/lib/server/admin/getAdminSignupLogData";

export default async function AdminSignupLogPage() {
  const data = await getAdminSignupLogData();
  return <AdminSignupLogView data={data} />;
}
