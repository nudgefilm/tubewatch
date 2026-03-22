/**
 * Google OAuth로 발급된 **사용자 액세스 토큰**(Supabase `session.provider_token`)으로
 * YouTube Data API v3 `channels.list?mine=true` 를 호출해, 로그인 계정이 **관리할 수 있는**
 * 채널이 있는지 확인한다.
 *
 * 필요 OAuth scope (Google Cloud / Supabase Provider 설정과 일치해야 함):
 * - `https://www.googleapis.com/auth/youtube.readonly` (권장, 읽기 전용)
 *   또는 `https://www.googleapis.com/auth/youtube`
 *
 * 참고: `mine=true` 는 위 스코프가 없으면 403/insufficientPermissions 로 실패한다.
 */

import type {
  ManagedYoutubeChannelRef,
  VerifyManagedYoutubeChannelsResult,
} from "@/lib/auth/youtubeVerificationTypes";

const CHANNELS_LIST_MINE_URL =
  "https://www.googleapis.com/youtube/v3/channels?part=id%2Csnippet&mine=true";

function isoNow(): string {
  return new Date().toISOString();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseManagedChannels(json: unknown): ManagedYoutubeChannelRef[] {
  if (!isRecord(json)) {
    return [];
  }
  const items = json.items;
  if (!Array.isArray(items)) {
    return [];
  }
  const out: ManagedYoutubeChannelRef[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    const id = item.id;
    const snippet = item.snippet;
    const title =
      isRecord(snippet) && typeof snippet.title === "string"
        ? snippet.title
        : "(제목 없음)";
    if (typeof id === "string" && id.trim() !== "") {
      out.push({ channelId: id, title });
    }
  }
  return out;
}

export type VerifyManagedYoutubeChannelsInput = {
  /** Supabase 세션의 Google `provider_token` (Bearer) */
  providerAccessToken: string;
};

/**
 * `channels.list?mine=true` 호출. 토큰/스코프/네트워크 오류는 `status: "error"` 또는 `"revoked"` 로 구분.
 */
export async function verifyManagedYoutubeChannels(
  input: VerifyManagedYoutubeChannelsInput
): Promise<VerifyManagedYoutubeChannelsResult> {
  const checkedAt = isoNow();
  const token = input.providerAccessToken.trim();
  if (token === "") {
    return {
      status: "error",
      managedChannels: [],
      checkedAt,
      errorMessage: "EMPTY_PROVIDER_TOKEN",
    };
  }

  let response: Response;
  try {
    response = await fetch(CHANNELS_LIST_MINE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "NETWORK_ERROR";
    return {
      status: "error",
      managedChannels: [],
      checkedAt,
      errorMessage: msg,
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      status: "revoked",
      managedChannels: [],
      checkedAt,
      errorMessage: `HTTP_${response.status}`,
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      managedChannels: [],
      checkedAt,
      errorMessage: `HTTP_${response.status}`,
    };
  }

  let body: unknown;
  try {
    body = (await response.json()) as unknown;
  } catch {
    return {
      status: "error",
      managedChannels: [],
      checkedAt,
      errorMessage: "INVALID_JSON",
    };
  }

  const managedChannels = parseManagedChannels(body);
  if (managedChannels.length === 0) {
    return {
      status: "unverified",
      managedChannels: [],
      checkedAt,
      errorMessage: null,
    };
  }

  return {
    status: "verified",
    managedChannels,
    checkedAt,
    errorMessage: null,
  };
}
