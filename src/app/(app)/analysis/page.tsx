/**
 * OPERATIONAL /analysis UI BASELINE (고정)
 * - 유일한 페이지 UI 엔트리: AnalysisReportPageClient (@/components/analysis/AnalysisReportPageClient)
 * - 데이터: getAnalysisPageData → buildAnalysisPageViewModel (ViewModel 규칙은 docs/ai-guardrail.md)
 */
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import { buildAnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel";
import {
  type ChannelSearchParams,
  pickChannelIdFromSearchParams,
} from "@/lib/navigation/pickChannelFromSearchParams";
import { AppRouteLoading } from "@/components/layout/AppRouteLoading";

const AnalysisReportPageClient = dynamic(
  () => import("@/components/analysis/AnalysisReportPageClient"),
  { loading: () => <AppRouteLoading variant="analysis" /> }
);

export default async function AnalysisRoutePage({
  searchParams,
}: {
  searchParams?: ChannelSearchParams;
}) {
  const channelId = pickChannelIdFromSearchParams(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/analysis", channelId)
  );

  const data = await getAnalysisPageData(channelId);

  if (!data) {
    redirect("/channels");
  }

  const viewModel = buildAnalysisPageViewModel(data);

  return (
    <AnalysisReportPageClient
      viewModel={viewModel}
      channels={data.channels ?? []}
      selectedChannel={data.selectedChannel ?? null}
    />
  );
}
