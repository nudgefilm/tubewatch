import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminUsersData, AdminUserRow } from "@/components/admin/types";

export async function getAdminUsersData(): Promise<AdminUsersData> {
  const [authRes, channelsRes, profilesRes, creditsRes, subscriptionsRes, analysisJobsRes] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
    supabaseAdmin.from("user_channels").select("user_id"),
    supabaseAdmin.from("profiles").select("id, role"),
    supabaseAdmin
      .from("user_credits")
      .select("user_id, lifetime_analyses_used, purchased_credits"),
    supabaseAdmin
      .from("user_subscriptions")
      .select("user_id, plan_id, billing_period, subscription_status, current_period_start, renewal_at, grant_type, pending_plan_id, pending_billing_period"),
    supabaseAdmin
      .from("analysis_jobs")
      .select("user_id")
      .eq("status", "completed"),
  ]);

  const authUsers = authRes.data?.users ?? [];

  const channelCountMap = new Map<string, number>();
  for (const row of (channelsRes.data ?? []) as { user_id: string | null }[]) {
    if (!row.user_id) continue;
    channelCountMap.set(row.user_id, (channelCountMap.get(row.user_id) ?? 0) + 1);
  }

  const roleMap = new Map<string, string>();
  for (const row of (profilesRes.data ?? []) as { id: string; role: string | null }[]) {
    if (row.role) roleMap.set(row.id, row.role);
  }

  type CreditsRow = { user_id: string; lifetime_analyses_used: number; purchased_credits: number };
  const creditsMap = new Map<string, CreditsRow>();
  for (const row of (creditsRes.data ?? []) as CreditsRow[]) {
    creditsMap.set(row.user_id, row);
  }

  type SubRow = {
    user_id: string;
    plan_id: string | null;
    billing_period: string | null;
    subscription_status: string | null;
    current_period_start: string | null;
    renewal_at: string | null;
    grant_type: string | null;
    pending_plan_id: string | null;
    pending_billing_period: string | null;
  };
  const subsMap = new Map<string, SubRow>();
  for (const row of (subscriptionsRes.data ?? []) as SubRow[]) {
    subsMap.set(row.user_id, row);
  }

  type JobRow = { user_id: string | null };
  const allJobs = (analysisJobsRes.data ?? []) as JobRow[];

  const analysisCountMap = new Map<string, number>();
  for (const row of allJobs) {
    if (!row.user_id) continue;
    analysisCountMap.set(row.user_id, (analysisCountMap.get(row.user_id) ?? 0) + 1);
  }

  const rows: AdminUserRow[] = authUsers.map((u) => {
    const meta = u.user_metadata ?? {};
    const credits = creditsMap.get(u.id);
    const sub = subsMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      display_name:
        (meta.name as string | undefined) ||
        (meta.full_name as string | undefined) ||
        null,
      created_at: u.created_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      channel_count: channelCountMap.get(u.id) ?? 0,
      role: roleMap.get(u.id) ?? null,
      lifetime_analyses_used: credits?.lifetime_analyses_used ?? null,
      purchased_credits: credits?.purchased_credits ?? null,
      total_analyses_count: analysisCountMap.get(u.id) ?? 0,
      plan_id: sub?.plan_id ?? null,
      billing_period: (sub?.billing_period === "monthly" || sub?.billing_period === "semiannual")
        ? sub.billing_period : null,
      subscription_status: sub?.subscription_status ?? null,
      renewal_at: sub?.renewal_at ?? null,
      grant_type: sub?.grant_type ?? null,
      pending_plan_id: sub?.pending_plan_id ?? null,
      pending_billing_period: (sub?.pending_billing_period === "monthly" || sub?.pending_billing_period === "semiannual")
        ? sub.pending_billing_period : null,
    };
  });

  rows.sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return b.created_at.localeCompare(a.created_at);
  });

  return { rows, total: rows.length };
}
