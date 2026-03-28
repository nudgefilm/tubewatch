import { ActionPlanPage } from "@/components/features/action-plan"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"

type PageProps = {
  searchParams?: { channel?: string; snapshot?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const snapshotId = searchParams?.snapshot
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/action-plan", channelId)
  )
  // 단일 진입점: getAnalysisPageData만 사용. snapshot 기반 조회.
  const data = await getAnalysisPageData({ channelId, snapshotId })
  // channelContext는 baseData에서 직접 추출 (builder 재조회 없음)
  // TODO(4-3B): buildActionPlanPageViewModel(data)를 UI에 연결
  const channelContext = data?.selectedChannel
    ? {
        title: data.selectedChannel.channel_title ?? null,
        thumbnailUrl: data.selectedChannel.thumbnail_url ?? null,
        subscriberCount: data.selectedChannel.subscriber_count ?? null,
        videoCount: data.selectedChannel.video_count ?? null,
      }
    : null
  return (
    <ActionPlanPage
      channelId={channelId}
      channelContext={channelContext}
    />
  )
}
