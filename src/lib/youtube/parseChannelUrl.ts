export type ParsedChannelInput =
  | { type: 'handle'; value: string }
  | { type: 'channelId'; value: string }
  | null

const STRIP_SUBPATHS = [
  '/videos',
  '/shorts',
  '/featured',
  '/about',
  '/streams',
  '/community',
  '/playlists',
  '/channels',
  '/live',
];

function addProtocolIfMissing(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return raw;
  return `https://${raw}`;
}

function stripTrailingSubpath(pathname: string): string {
  let result = pathname;
  for (const sub of STRIP_SUBPATHS) {
    if (result.endsWith(sub)) {
      result = result.slice(0, -sub.length);
      break;
    }
  }
  return result;
}

export function parseChannelUrl(url: string): ParsedChannelInput {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = addProtocolIfMissing(trimmed);
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace('www.', '').replace('m.', '');

    if (host !== 'youtube.com') {
      return null;
    }

    let pathname = parsed.pathname.replace(/\/+$/, '');
    pathname = stripTrailingSubpath(pathname);
    pathname = pathname.replace(/\/+$/, '');

    // https://www.youtube.com/@handle
    if (pathname.startsWith('/@')) {
      const handle = pathname.slice(2);
      if (!handle || handle.includes('/')) return null;

      return {
        type: 'handle',
        value: handle,
      };
    }

    // https://www.youtube.com/channel/UCxxxx
    if (pathname.startsWith('/channel/')) {
      const channelId = pathname.slice('/channel/'.length);
      if (!channelId || channelId.includes('/')) return null;

      return {
        type: 'channelId',
        value: channelId,
      };
    }

    return null;
  } catch {
    return null;
  }
}
