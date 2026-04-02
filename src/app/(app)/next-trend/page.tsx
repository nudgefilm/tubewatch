import { NextTrendPage } from "@/components/features/next-trend"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildNextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits"
import { isCurrentUserAdmin } from "@/lib/auth/is-admin"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/next-trend", channelId)
  )
  const [data, supabase, adminUser] = await Promise.all([
    getAnalysisPageData({ channelId, userId }),
    createClient(),
    isCurrentUserAdmin(),
  ])
  const viewModel = buildNextTrendPageViewModel(data)
  const limits = await getEffectiveLimits(supabase, userId)
  const isStarterPlan = !adminUser && limits.planId === "free"
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
      isStarterPlan={isStarterPlan}
    />
  )
}
