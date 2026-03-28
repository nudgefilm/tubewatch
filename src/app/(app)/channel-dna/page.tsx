import { ChannelDnaPage } from "@/components/features/channel-dna"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildChannelDnaPageViewModel } from "@/lib/channel-dna/channelDnaPageViewModel"

type PageProps = {
  searchParams?: { channel?: string; snapshot?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const snapshotId = searchParams?.snapshot
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/channel-dna", channelId)
  )
  const data = await getAnalysisPageData({ channelId, snapshotId })
  const viewModel = buildChannelDnaPageViewModel(data)
  const channelContext = data?.selectedChannel
    ? {
        title: data.selectedChannel.channel_title ?? null,
        thumbnailUrl: data.selectedChannel.thumbnail_url ?? null,
        subscriberCount: data.selectedChannel.subscriber_count ?? null,
        videoCount: data.selectedChannel.video_count ?? null,
      }
    : null
  return (
    <ChannelDnaPage
      channelId={channelId}
      channelContext={channelContext}
      viewModel={viewModel}
    />
  )
}
