export type ParsedChannelInput =
  | { type: 'handle'; value: string }
  | { type: 'channelId'; value: string }
  | null

export function parseChannelUrl(url: string): ParsedChannelInput {
  if (!url) return null

  const trimmed = url.trim()

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace('www.', '')

    if (host !== 'youtube.com' && host !== 'm.youtube.com') {
      return null
    }

    const pathname = parsed.pathname.replace(/\/+$/, '')

    // https://www.youtube.com/@handle
    if (pathname.startsWith('/@')) {
      const handle = pathname.slice(2).trim()
      if (!handle) return null

      return {
        type: 'handle',
        value: handle,
      }
    }

    // https://www.youtube.com/channel/UCxxxx
    if (pathname.startsWith('/channel/')) {
      const channelId = pathname.replace('/channel/', '').trim()
      if (!channelId) return null

      return {
        type: 'channelId',
        value: channelId,
      }
    }

    return null
  } catch {
    return null
  }
}