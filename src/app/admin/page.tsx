import AdminPage from "@/v0-tubewatchui/app/admin/page";

import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";

export default async function AdminRoutePage() {
  await ensureAdminOrRedirect();
  return <AdminPage />;
}
