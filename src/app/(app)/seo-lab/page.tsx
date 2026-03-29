import { SeoLabPage } from "@/components/features/seo-lab"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildSeoLabPageViewModel } from "@/lib/seo-lab/seoLabPageViewModel"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/seo-lab", channelId)
  )
  const data = await getAnalysisPageData({ channelId, userId })
  const viewModel = buildSeoLabPageViewModel(data)
  const channelContext = data?.selectedChannel
    ? {
        title: data.selectedChannel.channel_title ?? null,
        thumbnailUrl: data.selectedChannel.thumbnail_url ?? null,
        subscriberCount: data.selectedChannel.subscriber_count ?? null,
        videoCount: data.selectedChannel.video_count ?? null,
      }
    : null
  return (
    <SeoLabPage
      channelId={channelId}
      channelContext={channelContext}
      viewModel={viewModel}
    />
  )
}
