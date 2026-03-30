import { SeoLabPage } from "@/components/features/seo-lab"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildSeoLabPageViewModel } from "@/lib/seo-lab/seoLabPageViewModel"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/seo-lab", channelId)
  )
  const [data, supabase] = await Promise.all([
    getAnalysisPageData({ channelId, userId }),
    createClient(),
  ])
  const viewModel = buildSeoLabPageViewModel(data)
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
    <SeoLabPage
      channelId={channelId}
      channelContext={channelContext}
      viewModel={viewModel}
      isStarterPlan={isStarterPlan}
    />
  )
}
