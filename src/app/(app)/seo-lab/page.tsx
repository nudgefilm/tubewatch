import { SeoLabPage } from "@/components/features/seo-lab"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildAnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/seo-lab", channelId)
  )
  const data = await getAnalysisPageData(channelId)
  const viewModel = buildAnalysisPageViewModel(data)
  return (
    <SeoLabPage
      channelId={channelId}
      channelContext={viewModel.channel}
    />
  )
}
