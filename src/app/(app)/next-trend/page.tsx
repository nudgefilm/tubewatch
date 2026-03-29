import { NextTrendPage } from "@/components/features/next-trend"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildNextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/next-trend", channelId)
  )
  const data = await getAnalysisPageData({ channelId, userId })
  const viewModel = buildNextTrendPageViewModel(data)
  const channelContext = data?.selectedChannel
    ? {
        title: data.selectedChannel.channel_title ?? null,
        thumbnailUrl: data.selectedChannel.thumbnail_url ?? null,
        subscriberCount: data.selectedChannel.subscriber_count ?? null,
        videoCount: data.selectedChannel.video_count ?? null,
      }
    : null
  return (
    <NextTrendPage
      channelId={channelId}
      channelContext={channelContext}
      viewModel={viewModel}
    />
  )
}
