/**
 * Domain(서비스 내부 표준) 타입 레이어
 *
 * External → Domain 변환 후의 정규화된 데이터 구조.
 * 필드명 규칙: camelCase.
 * 숫자 필드: 항상 number (string 금지).
 * 날짜 필드: ISO 8601 string 또는 null.
 * thumbnail 필드: thumbnailUrl (camelCase 통일).
 *
 * 정규 소스: src/lib/analysis/engine/types.ts
 */

// 채널 + 영상 정규화 타입 (re-export from canonical source)
export type {
  NormalizedChannel,
  NormalizedVideo,
  NormalizedChannelDataset,
  ChannelMetrics,
  ChannelFeatureMap,
  FeatureScoreResult,
  AnalysisContext,
} from "@/lib/analysis/engine/types"

import type { NormalizedVideo } from "@/lib/analysis/engine/types"

/**
 * 영상 목록만 있는 데이터셋 (채널 정보 없이 영상 분석만 필요한 경우).
 * NormalizedChannelDataset의 서브셋.
 */
export type NormalizedVideoDataset = {
  videos: NormalizedVideo[]
  collectedVideoCount: number
}
