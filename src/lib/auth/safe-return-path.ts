/** OAuth 이후 브라우저 리다이렉트에 사용할 안전한 내부 경로만 허용 (오픈 리다이렉트 방지). */
export const DEFAULT_POST_LOGIN_PATH = "/channels";

export function getSafeOAuthReturnPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_POST_LOGIN_PATH
): string {
  if (raw == null || raw === "") {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) {
    return fallback;
  }
  if (trimmed.startsWith("//")) {
    return fallback;
  }
  if (trimmed.includes("\\")) {
    return fallback;
  }
  if (trimmed.includes("://")) {
    return fallback;
  }
  if (trimmed.toLowerCase().startsWith("/javascript:")) {
    return fallback;
  }

  return trimmed;
}
