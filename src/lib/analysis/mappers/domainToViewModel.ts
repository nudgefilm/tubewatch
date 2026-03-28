/**
 * Domain → ViewModel 매핑 레이어
 *
 * Analysis 파이프라인의 공식 진입점.
 * Raw (AnalysisPageData) → Domain 변환 → AnalysisPageViewModel 흐름을 관장한다.
 *
 * STEP 4-2: adaptAnalysisPageDataToViewModel이 /analysis page.tsx에서 실제 호출됨.
 * STEP 4-3: mapDomainToAnalysisViewModel 구현 후 AnalysisPageData 의존 완전 제거 예정.
 */

import type { AnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import type { AnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel"
import { buildAnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel"
import {
  mapDbChannelToAnalysisDomain,
  type AnalysisChannelDomain,
} from "@/lib/analysis/mappers/dbToDomain"
import type { NormalizedChannelDataset } from "@/lib/types/domain"

// ─── STEP 4-2: 실제 Adapter 진입점 ──────────────────────────────────────────

/**
 * [ADAPTER] /analysis 메인 파이프라인 공식 진입점.
 *
 * 변환 경계:
 *   [경계 1] DB Row → Domain (thumbnail 변환):
 *            UserChannelRow → AnalysisChannelDomain
 *            thumbnail_url (DB snake_case) → thumbnailUrl (Domain camelCase)
 *            담당: mapDbChannelToAnalysisDomain()
 *
 *   [경계 2] Domain → ViewModel:
 *            buildAnalysisPageViewModel (기존 builder 위임)
 *            TODO(STEP 4-3): AnalysisPageData 의존 제거, Domain 타입 native 빌드로 교체
 *
 * /analysis/page.tsx가 이 함수를 호출한다.
 * 다른 feature page는 STEP 4-3에서 동일 패턴 적용.
 */
export function adaptAnalysisPageDataToViewModel(
  data: AnalysisPageData | null
): AnalysisPageViewModel {
  // [경계 1] DB Row → Domain: 채널 정보 명시 변환
  // thumbnail_url (DB) → thumbnailUrl (Domain) — 이 라인이 유일한 변환 지점
  const channelDomain: AnalysisChannelDomain | null = data?.selectedChannel
    ? mapDbChannelToAnalysisDomain(data.selectedChannel)
    : null

  // [경계 2] Domain → ViewModel: 기존 builder 위임
  // TODO(STEP 4-3): replace with domain-native builder, remove AnalysisPageData dependency
  // TODO(STEP 4-3): move duplicate transform logic (parseVideosFromSnapshot 등) to externalToDomain
  const vm = buildAnalysisPageViewModel(data)

  // Adapter 보장: channelDomain에서 변환한 thumbnailUrl이 ViewModel에 반영
  // 기존 builder도 동일 값을 쓰지만, adapter가 공식 변환 경계임을 명시하기 위해 override.
  if (vm.channel !== null && channelDomain !== null) {
    return {
      ...vm,
      channel: {
        ...vm.channel,
        thumbnailUrl: channelDomain.thumbnailUrl,
      },
    }
  }

  return vm
}

// ─── STEP 4-3 스켈레톤 ──────────────────────────────────────────────────────

/**
 * [SKELETON] NormalizedChannelDataset → AnalysisPageViewModel 변환.
 * STEP 4-3에서 AnalysisPageData 의존을 완전히 제거한 뒤 구현.
 * 현재는 adaptAnalysisPageDataToViewModel을 사용할 것.
 */
export function mapDomainToAnalysisViewModel(
  _dataset: NormalizedChannelDataset
): Partial<AnalysisPageViewModel> {
  // TODO(STEP 4-3): implement — AnalysisPageData 없이 Domain 타입만으로 ViewModel 빌드
  throw new Error("mapDomainToAnalysisViewModel: not yet implemented (STEP 4-3)")
}

/**
 * [SKELETON] NormalizedChannelDataset에서 채널 헤더 ViewModel만 추출.
 * STEP 4-3에서 구현 예정.
 */
export function mapDomainToChannelHeaderVm(
  _dataset: NormalizedChannelDataset
): AnalysisPageViewModel["channel"] {
  // TODO(STEP 4-3): implement
  throw new Error("mapDomainToChannelHeaderVm: not yet implemented (STEP 4-3)")
}
