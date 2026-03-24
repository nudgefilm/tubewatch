/**
 * OPERATIONAL /analysis UI BASELINE (고정)
 * - 유일한 페이지 UI 엔트리: AnalysisReportPageClient (@/components/analysis/AnalysisReportPageClient)
 * - 데이터: getAnalysisPageData → buildAnalysisPageViewModel (ViewModel 규칙은 docs/ai-guardrail.md)
 */
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

