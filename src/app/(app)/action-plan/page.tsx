import { ActionPlanPage } from "@/components/features/action-plan"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildActionPlanPageViewModel } from "@/lib/action-plan/actionPlanPageViewModel"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/action-plan", channelId)
  )
  const data = await getAnalysisPageData({ channelId, userId })
  const viewModel = buildActionPlanPageViewModel(data)
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
      viewModel={viewModel}
    />
  )
}
