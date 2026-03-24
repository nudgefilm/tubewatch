/**
 * 보호된 앱 라우트 공통: `?channel=` / `?channelId=` 에서 user_channels.id 추출.
 */
export type ChannelSearchParams = {
  channel?: string | string[];
  channelId?: string | string[];
};

export function pickChannelIdFromSearchParams(
  sp: ChannelSearchParams | undefined
): string | undefined {
  const raw = sp?.channel ?? sp?.channelId;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim() !== "") {
    return raw[0];
  }
  return undefined;
}
