import AdminChannelsView from "@/components/admin/AdminChannelsView";
import { getAdminChannelsData } from "@/lib/server/admin/getAdminChannelsData";

export default async function AdminChannelsPage() {
  const data = await getAdminChannelsData();
  return <AdminChannelsView data={data} />;
}
