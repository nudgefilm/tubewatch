export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase/admin";
import DiagnoseLeadsView from "@/components/admin/DiagnoseLeadsView";

export default async function DiagnoseLeadsPage() {
  const { data: leads } = await supabaseAdmin
    .from("channel_diagnose_leads")
    .select("id, channel_url, contact_email, status, report_token, created_at")
    .order("created_at", { ascending: false });

  return <DiagnoseLeadsView leads={leads ?? []} />;
}
