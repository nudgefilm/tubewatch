import { supabaseAdmin } from "@/lib/supabase/admin";

export type SignupLogRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  channel_title: string | null;
  joined_at: string | null;
  withdrawn_at: string | null;
  analysis_success_count: number;
  analysis_failure_count: number;
};

export type AdminSignupLogData = {
  rows: SignupLogRow[];
  total: number;
};

export async function getAdminSignupLogData(): Promise<AdminSignupLogData> {
  const { data, error, count } = await supabaseAdmin
    .from("user_signup_log")
    .select("id, user_id, email, channel_title, joined_at, withdrawn_at, analysis_success_count, analysis_failure_count", { count: "exact" })
    .order("joined_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getAdminSignupLogData] error:", error.message);
    return { rows: [], total: 0 };
  }

  return {
    rows: (data ?? []) as SignupLogRow[],
    total: count ?? 0,
  };
}
