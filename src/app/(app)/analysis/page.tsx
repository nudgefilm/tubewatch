import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";

import { buildAnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel";

import AnalysisReportPageClient from "@/components/analysis/AnalysisReportPageClient";

export default async function AnalysisRoutePage() {
  await redirectToLandingAuthUnlessSignedIn("/analysis");

  const data = await getAnalysisPageData();

  const viewModel = buildAnalysisPageViewModel(data);

  return (
    <AnalysisReportPageClient
      viewModel={viewModel}
      channels={data?.channels ?? []}
      selectedChannel={data?.selectedChannel ?? null}
    />
  );
}

