/**
 * External → Domain 매핑 레이어
 *
 * YouTube API 원본 타입을 서비스 내부 표준(Domain) 타입으로 변환한다.
 * 이 파일의 함수를 통해서만 External → Domain 변환이 이루어져야 한다.
 *
 * 주의: 기존 코드에서는 아직 이 함수를 호출하지 않는다 (STEP 4-2에서 연결 예정).
 */

import type { YouTubeChannelData, YouTubeVideoData } from "@/lib/types/external"
import type { NormalizedChannel, NormalizedVideo } from "@/lib/types/domain"

// ─── 내부 헬퍼 ────────────────────────────────────────────────────────────────

/**
 * ISO 8601 duration 문자열(PT1H30M45S)을 초(second)로 변환.
 * 파싱 실패 시 0 반환.
 */
function parseDurationToSeconds(duration: string | null): number {
  if (!duration) return 0
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0
  const hours = parseInt(match[1] ?? "0", 10)
  const minutes = parseInt(match[2] ?? "0", 10)
  const seconds = parseInt(match[3] ?? "0", 10)
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * ISO 8601 날짜 문자열로부터 경과 일수 계산.
 * 파싱 실패 또는 미래 날짜는 null 반환.
 */
function calcDaysSincePublished(publishedAt: string | null): number | null {
  if (!publishedAt) return null
  const published = new Date(publishedAt)
  if (isNaN(published.getTime())) return null
  const days = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24)
  return days >= 0 ? Math.floor(days) : null
}

/**
 * 채널 공개일로부터 채널 나이(일수) 계산.
 */
function calcChannelAgeDays(publishedAt: string | null): number | null {
  return calcDaysSincePublished(publishedAt)
}

// ─── Public 매핑 함수 ─────────────────────────────────────────────────────────

/**
 * YouTube API 채널 원본 → NormalizedChannel 변환.
 * thumbnail 필드: External.thumbnailUrl → Domain.thumbnail (NormalizedChannel 규칙).
 */
export function mapExternalChannelToDomain(
  data: YouTubeChannelData
): NormalizedChannel {
  return {
    youtubeChannelId: data.youtubeChannelId,
    title: data.title,
    description: data.description ?? "",
    publishedAt: data.publishedAt,
    subscriberCount: data.subscriberCount ?? 0,
    videoCount: data.videoCount ?? 0,
    viewCount: data.viewCount ?? 0,
    channelAgeDays: calcChannelAgeDays(data.publishedAt),
  }
}

/**
 * YouTube API 영상 목록 원본 → NormalizedVideo[] 변환.
 * duration: ISO 8601(PT...) → durationSeconds(number).
 * thumbnail 필드: External.thumbnailUrl → Domain.thumbnail.
 */
export function mapExternalVideosToDomain(
  videos: YouTubeVideoData[]
): NormalizedVideo[] {
  return videos.map((v): NormalizedVideo => {
    const viewCount = v.viewCount ?? 0
    const likeCount = v.likeCount ?? 0
    const commentCount = v.commentCount ?? 0
    const durationSeconds = parseDurationToSeconds(v.duration)
    const daysSincePublished = calcDaysSincePublished(v.publishedAt)
    const viewsPerDay =
      daysSincePublished != null && daysSincePublished > 0
        ? viewCount / daysSincePublished
        : 0
    const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0

    return {
      videoId: v.videoId,
      title: v.title,
      description: v.description,
      publishedAt: v.publishedAt,
      thumbnail: v.thumbnailUrl,         // External: thumbnailUrl → Domain: thumbnail
      viewCount,
      likeCount,
      commentCount,
      durationSeconds,
      tags: v.tags,
      categoryId: v.categoryId,
      titleLength: v.title.length,
      descriptionLength: v.description.length,
      tagCount: v.tags.length,
      daysSincePublished,
      viewsPerDay,
      engagementRate,
    }
  })
}
