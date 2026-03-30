import { createClient } from "@/lib/supabase/server";

/**
 * userId 기준으로 profiles.role을 조회해 admin 여부를 반환한다.
 *
 * - profiles 행 없음 / DB 오류 / role != 'admin' → false
 * - 이메일 하드코딩 판별 없음 — DB single source of truth
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || data == null) return false;

    const row = data as Record<string, unknown>;
    return row.role === "admin";
  } catch {
    return false;
  }
}
