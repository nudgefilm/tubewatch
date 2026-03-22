import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

type ProfileRole = "user" | "admin";

function parseProfileRole(raw: unknown): ProfileRole {
  if (raw === "admin") {
    return "admin";
  }
  return "user";
}

/**
 * 현재 세션 사용자의 `profiles.role`. 프로필 행이 없거나 조회 실패 시 `user`로 간주.
 */
export async function getCurrentUserProfileRole(): Promise<ProfileRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || data == null) {
    return "user";
  }

  const row: unknown = data;
  if (typeof row !== "object" || row === null || !("role" in row)) {
    return "user";
  }

  const rawRole = (row as { role: unknown }).role;
  if (typeof rawRole !== "string") {
    return "user";
  }

  return parseProfileRole(rawRole);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserProfileRole();
  return role === "admin";
}

/**
 * `/admin` 전용: 비로그인 → `/?authModal=1&next=/admin`, 비관리자 로그인 → `/analysis`.
 */
export async function ensureAdminOrRedirect(): Promise<void> {
  await redirectToLandingAuthUnlessSignedIn("/admin");

  const admin = await isCurrentUserAdmin();
  if (!admin) {
    redirect("/analysis");
  }
}
