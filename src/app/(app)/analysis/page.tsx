import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { buildAnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel"
import AnalysisReportPageClient from "@/components/analysis/AnalysisReportPageClient"

type PageProps = {
  searchParams?: { channel?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/analysis", channelId)
  )

  const data = await getAnalysisPageData(channelId)
  const viewModel = buildAnalysisPageViewModel(data)

  return (
    <AnalysisReportPageClient
      viewModel={viewModel}
      channels={data?.channels ?? []}
      selectedChannel={data?.selectedChannel ?? null}
    />
  )
}
