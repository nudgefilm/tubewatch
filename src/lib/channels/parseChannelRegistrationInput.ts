import { parseChannelUrl } from "@/lib/youtube/parseChannelUrl";
import type { ChannelLookupInput } from "@/lib/youtube/getChannelInfo";

/** 입력값에 프로토콜이 없으면 https:// 붙임 */
export function normalizeChannelInput(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

/**
 * 채널 URL / @핸들 / UC channelId 등 수동 등록 입력을 파싱합니다.
 */
export function parseChannelRegistrationInput(
  raw: string
): ChannelLookupInput | null {
  const t = raw.trim();
  if (!t) return null;

  if (/^UC[\w-]{11,}$/.test(t)) {
    return { type: "channelId", value: t };
  }

  if (t.startsWith("@") && !/\s/.test(t)) {
    const h = t.slice(1);
    if (h.length > 0) {
      return { type: "handle", value: h };
    }
  }

  const withProtocol = normalizeChannelInput(t);
  const parsed = parseChannelUrl(withProtocol);
  if (!parsed) return null;
  if (parsed.type === "handle") {
    return { type: "handle", value: parsed.value };
  }
  return { type: "channelId", value: parsed.value };
}
