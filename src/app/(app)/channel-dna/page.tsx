import type { Metadata } from "next"
import { ChannelDnaPage } from "@/components/features/channel-dna"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildChannelDnaPageViewModel } from "@/lib/channel-dna/channelDnaPageViewModel"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits"
import { isCurrentUserAdmin } from "@/lib/auth/is-admin"

type PageProps = {
  searchParams?: { channel?: string }
}

export const metadata: Metadata = {
  title: "Channel DNA | TubeWatch",
  description: "채널의 강점·약점 패턴, 포맷 분포, 성과 구조를 분석합니다.",
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/channel-dna", channelId)
  )
  const [data, supabase, adminUser] = await Promise.all([
    getAnalysisPageData({ channelId, userId }),
    createClient(),
    isCurrentUserAdmin(),
  ])
  const viewModel = buildChannelDnaPageViewModel(data)
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
    <ChannelDnaPage
      channelId={channelId}
      channelContext={channelContext}
      viewModel={viewModel}
      isStarterPlan={isStarterPlan}
    />
  )
}
