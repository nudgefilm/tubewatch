import AnalysisPage from "@/v0-tubewatchui/app/(app)/analysis/page";



import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user";

import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";

import { buildAnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel";



export default async function AnalysisRoutePage() {

  await redirectToLandingAuthUnlessSignedIn("/analysis");

  const data = await getAnalysisPageData();

  const viewModel = buildAnalysisPageViewModel(data);

  return <AnalysisPage viewModel={viewModel} />;

}

