import { isAdmin } from "@/lib/config/admin";

const ADMIN_CHANNEL_LIMIT = 999;
const NORMAL_CHANNEL_LIMIT = 3;

export function isAdminUser(email?: string | null): boolean {
  return isAdmin(email);
}

export function getChannelLimit(email?: string | null): number {
  return isAdmin(email) ? ADMIN_CHANNEL_LIMIT : NORMAL_CHANNEL_LIMIT;
}

export function canBypassCooldown(email?: string | null): boolean {
  return isAdmin(email);
}
