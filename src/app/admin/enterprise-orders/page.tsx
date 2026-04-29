export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase/admin";
import EnterpriseOrdersView from "@/components/admin/EnterpriseOrdersView";

export default async function EnterpriseOrdersPage() {
  const [{ data: orders }, { data: inquiries }] = await Promise.all([
    supabaseAdmin
      .from("enterprise_orders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("b2b_inquiries")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <EnterpriseOrdersView
      orders={orders ?? []}
      inquiries={inquiries ?? []}
    />
  );
}
