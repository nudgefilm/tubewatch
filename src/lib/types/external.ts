/**
 * External API 원본 타입 레이어
 *
 * 외부 시스템(YouTube Data API v3)에서 받아온 원형 그대로의 타입을 정의한다.
 * 필드명 규칙: camelCase (YouTube API 응답 구조 그대로).
 *
 * 주의: 이 레이어의 타입을 직접 화면에 렌더하거나 DB에 저장하지 말 것.
 *       반드시 Domain 레이어로 변환 후 사용한다.
 *
 * 정규 소스: src/lib/youtube/types.ts
 */

// YouTube API 채널 응답 원형 (re-export from canonical source)
export type { YouTubeChannelData, YouTubeVideoData } from "@/lib/youtube/types"
