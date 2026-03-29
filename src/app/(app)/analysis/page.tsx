import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { adaptAnalysisPageDataToViewModel } from "@/lib/analysis/mappers/domainToViewModel"
import { ChannelAnalysisPage } from "@/components/features/analysis"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel

  // guard + userId 획득 (getUser 1회만 발생)
  const userId = await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/analysis", channelId)
  )

  // snapshot은 URL에 포함하지 않음 — 항상 latestResult 기준으로 렌더
  const data = await getAnalysisPageData({ channelId, userId })
  const viewModel = adaptAnalysisPageDataToViewModel(data)

  return (
    <ChannelAnalysisPage
      channelId={channelId ?? data?.selectedChannel?.id}
      viewModel={viewModel}
    />
  )
}
