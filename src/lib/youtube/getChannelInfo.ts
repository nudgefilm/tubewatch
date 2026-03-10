type ChannelInfo = {
    channelId: string
    title: string | null
    thumbnailUrl: string | null
    subscriberCount: number | null
  }
  
  type SearchResponse = {
    items?: Array<{
      id?: {
        channelId?: string
      }
    }>
  }
  
  type ChannelsResponse = {
    items?: Array<{
      id?: string
      snippet?: {
        title?: string
        thumbnails?: {
          default?: { url?: string }
          medium?: { url?: string }
          high?: { url?: string }
        }
      }
      statistics?: {
        subscriberCount?: string
      }
    }>
  }
  
  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    })
  
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`YOUTUBE_API_ERROR: ${response.status} ${text}`)
    }
  
    return response.json()
  }
  
  async function getChannelById(
    channelId: string,
    apiKey: string
  ): Promise<ChannelInfo> {
    const url =
      `https://www.googleapis.com/youtube/v3/channels` +
      `?part=snippet,statistics&id=${encodeURIComponent(channelId)}` +
      `&key=${encodeURIComponent(apiKey)}`
  
    const data = await fetchJson<ChannelsResponse>(url)
    const item = data.items?.[0]
  
    if (!item?.id) {
      throw new Error('CHANNEL_NOT_FOUND')
    }
  
    const thumbnailUrl =
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null
  
    return {
      channelId: item.id,
      title: item.snippet?.title ?? null,
      thumbnailUrl,
      subscriberCount: item.statistics?.subscriberCount
        ? Number(item.statistics.subscriberCount)
        : null,
    }
  }
  
  async function getChannelIdByHandle(
    handle: string,
    apiKey: string
  ): Promise<string> {
    const query = `@${handle}`
  
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}` +
      `&key=${encodeURIComponent(apiKey)}`
  
    const data = await fetchJson<SearchResponse>(url)
    const channelId = data.items?.[0]?.id?.channelId
  
    if (!channelId) {
      throw new Error('CHANNEL_NOT_FOUND_BY_HANDLE')
    }
  
    return channelId
  }
  
  export async function getChannelInfo(input: {
    type: 'handle' | 'channelId'
    value: string
  }): Promise<ChannelInfo> {
    const apiKey = process.env.YOUTUBE_API_KEY
  
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY_MISSING')
    }
  
    if (input.type === 'channelId') {
      return getChannelById(input.value, apiKey)
    }
  
    const channelId = await getChannelIdByHandle(input.value, apiKey)
    return getChannelById(channelId, apiKey)
  }