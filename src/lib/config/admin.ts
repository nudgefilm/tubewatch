const RAW_ADMIN_EMAILS = [
  "nudgefilm@gmail.com",
] as const;

export const ADMIN_EMAILS: readonly string[] = RAW_ADMIN_EMAILS.map(
  (e) => e.toLowerCase().trim()
);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(normalized);
}
