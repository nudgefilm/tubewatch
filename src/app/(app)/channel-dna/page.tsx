import { ChannelDnaPage } from "@/components/features/channel-dna"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildChannelDnaPageViewModel } from "@/lib/channel-dna/channelDnaPageViewModel"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/channel-dna", channelId)
  )
  const [data, supabase] = await Promise.all([
    getAnalysisPageData({ channelId, userId }),
    createClient(),
  ])
  const viewModel = buildChannelDnaPageViewModel(data)
  const limits = await getEffectiveLimits(supabase, userId)
  const isStarterPlan = limits.planId === "free"
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
      isStarterPlan={isStarterPlan}
    />
  )
}
