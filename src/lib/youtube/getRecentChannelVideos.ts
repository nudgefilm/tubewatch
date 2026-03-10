type YouTubeSearchItem = {
    id?: {
      videoId?: string
    }
    snippet?: {
      publishedAt?: string
      title?: string
      description?: string
      thumbnails?: {
        default?: { url?: string }
        medium?: { url?: string }
        high?: { url?: string }
      }
    }
  }
  
  type YouTubeSearchResponse = {
    items?: YouTubeSearchItem[]
  }
  
  type YouTubeVideoItem = {
    id?: string
    contentDetails?: {
      duration?: string
    }
    statistics?: {
      viewCount?: string
      likeCount?: string
      commentCount?: string
    }
  }
  
  type YouTubeVideosResponse = {
    items?: YouTubeVideoItem[]
  }
  
  export type RecentVideo = {
    videoId: string
    title: string | null
    description: string | null
    publishedAt: string | null
    thumbnailUrl: string | null
    duration: string | null
    viewCount: number | null
    likeCount: number | null
    commentCount: number | null
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
  
  function toNumber(value?: string): number | null {
    if (!value) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  
  export async function getRecentChannelVideos(
    channelId: string,
    maxResults = 20
  ): Promise<RecentVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY
  
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY_MISSING')
    }
  
    const safeMax = Math.min(Math.max(maxResults, 1), 20)
  
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&channelId=${encodeURIComponent(channelId)}` +
      `&order=date` +
      `&type=video` +
      `&maxResults=${safeMax}` +
      `&key=${encodeURIComponent(apiKey)}`
  
    const searchData = await fetchJson<YouTubeSearchResponse>(searchUrl)
    const searchItems = searchData.items ?? []
  
    const videoIds = searchItems
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id)
  
    if (videoIds.length === 0) {
      return []
    }
  
    const videosUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=contentDetails,statistics` +
      `&id=${encodeURIComponent(videoIds.join(','))}` +
      `&key=${encodeURIComponent(apiKey)}`
  
    const videosData = await fetchJson<YouTubeVideosResponse>(videosUrl)
    const videoDetailMap = new Map<string, YouTubeVideoItem>()
  
    for (const item of videosData.items ?? []) {
      if (item.id) {
        videoDetailMap.set(item.id, item)
      }
    }
  
    return videoIds.map((videoId) => {
      const searchItem = searchItems.find((item) => item.id?.videoId === videoId)
      const detailItem = videoDetailMap.get(videoId)
  
      const thumbnailUrl =
        searchItem?.snippet?.thumbnails?.high?.url ||
        searchItem?.snippet?.thumbnails?.medium?.url ||
        searchItem?.snippet?.thumbnails?.default?.url ||
        null
  
      return {
        videoId,
        title: searchItem?.snippet?.title ?? null,
        description: searchItem?.snippet?.description ?? null,
        publishedAt: searchItem?.snippet?.publishedAt ?? null,
        thumbnailUrl,
        duration: detailItem?.contentDetails?.duration ?? null,
        viewCount: toNumber(detailItem?.statistics?.viewCount),
        likeCount: toNumber(detailItem?.statistics?.likeCount),
        commentCount: toNumber(detailItem?.statistics?.commentCount),
      }
    })
  }