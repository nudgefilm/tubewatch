import { redirect } from "next/navigation"
import {
  redirectToLandingAuthUnlessSignedIn,
  buildProtectedReturnPath,
} from "@/lib/auth/require-app-user"
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData"
import { adaptAnalysisPageDataToViewModel } from "@/lib/analysis/mappers/domainToViewModel"
import { ChannelAnalysisPage } from "@/components/features/analysis"

type PageProps = {
  searchParams?: { channel?: string; snapshot?: string }
}

export default async function Page({ searchParams }: PageProps) {
  const channelId = searchParams?.channel
  const snapshotId = searchParams?.snapshot

  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/analysis", channelId)
  )

  // snapshot 없으면 최신 결과로 anchoring 후 redirect
  if (!snapshotId) {
    const data = await getAnalysisPageData({ channelId })
    if (data?.selectedChannel && data.latestResult?.id) {
      const resolvedChannelId = data.selectedChannel.id
      const resolvedSnapshotId = data.latestResult.id
      redirect(
        `/analysis?channel=${encodeURIComponent(resolvedChannelId)}&snapshot=${encodeURIComponent(resolvedSnapshotId)}`
      )
    }
    // 분석 결과 없음 — 빈 상태 렌더
    const viewModel = adaptAnalysisPageDataToViewModel(data)
    return (
      <ChannelAnalysisPage
        channelId={data?.selectedChannel?.id}
        viewModel={viewModel}
      />
    )
  }

  // snapshot 있음: 해당 row 기준으로 데이터 조회
  const data = await getAnalysisPageData({ channelId, snapshotId })
  // [Adapter] DB Raw → Domain → ViewModel (경계: adaptAnalysisPageDataToViewModel)
  const viewModel = adaptAnalysisPageDataToViewModel(data)

  return (
    <ChannelAnalysisPage
      channelId={channelId}
      viewModel={viewModel}
    />
  )
}
