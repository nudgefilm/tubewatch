import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { adaptAnalysisPageDataToViewModel } from "@/lib/analysis/mappers/domainToViewModel"
import { ChannelAnalysisPage } from "@/components/features/analysis"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits"
import { isCurrentUserAdmin } from "@/lib/auth/is-admin"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel

  // guard + userId 획득 (getUser 1회만 발생)
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/analysis", channelId)
  )

  const [data, supabase, adminUser] = await Promise.all([
    getAnalysisPageData({ channelId, userId }),
    createClient(),
    isCurrentUserAdmin(),
  ])
  const viewModel = adaptAnalysisPageDataToViewModel(data)
  const limits = await getEffectiveLimits(supabase, userId)
  const isStarterPlan = !adminUser && limits.planId === "free"

  return (
    <ChannelAnalysisPage
      channelId={channelId ?? data?.selectedChannel?.id}
      viewModel={viewModel}
      isStarterPlan={isStarterPlan}
    />
  )
}
