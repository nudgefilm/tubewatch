import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminUsersData, AdminUserRow } from "@/components/admin/types";

export async function getAdminUsersData(): Promise<AdminUsersData> {
  const [authRes, channelsRes, profilesRes] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
    supabaseAdmin.from("user_channels").select("user_id"),
    supabaseAdmin.from("profiles").select("id, role"),
  ]);

  const authUsers = authRes.data?.users ?? [];

  // channel count per user
  const channelCountMap = new Map<string, number>();
  for (const row of (channelsRes.data ?? []) as { user_id: string | null }[]) {
    if (!row.user_id) continue;
    channelCountMap.set(row.user_id, (channelCountMap.get(row.user_id) ?? 0) + 1);
  }

  // role per user
  const roleMap = new Map<string, string>();
  for (const row of (profilesRes.data ?? []) as { id: string; role: string | null }[]) {
    if (row.role) roleMap.set(row.id, row.role);
  }

  const rows: AdminUserRow[] = authUsers.map((u) => {
    const meta = u.user_metadata ?? {};
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
    };
  });

  // newest first
  rows.sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return b.created_at.localeCompare(a.created_at);
  });

  return { rows, total: rows.length };
}
