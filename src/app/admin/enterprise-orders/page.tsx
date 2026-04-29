export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase/admin";
import EnterpriseOrdersView from "@/components/admin/EnterpriseOrdersView";

export default async function EnterpriseOrdersPage() {
  const [{ data: orders }, { data: inquiries }, { data: reports }] = await Promise.all([
    supabaseAdmin
      .from("enterprise_orders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("b2b_inquiries")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("manus_reports")
      .select("id, access_token, status, year_month, created_at, user_channel_id, user_channels(channel_title, channel_url)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <EnterpriseOrdersView
      orders={orders ?? []}
      inquiries={inquiries ?? []}
      reports={(reports ?? []).map((r) => ({
        ...r,
        user_channels: Array.isArray(r.user_channels) ? (r.user_channels[0] ?? null) : r.user_channels,
      })) as ManusReportRow[]}
    />
  );
}

type ManusReportRow = {
  id: string;
  access_token: string;
  status: string;
  year_month: string;
  created_at: string;
  user_channel_id: string;
  user_channels: { channel_title: string | null; channel_url: string | null } | null;
};

export type { ManusReportRow };
