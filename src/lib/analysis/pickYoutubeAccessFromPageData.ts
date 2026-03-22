import { deniedYoutubeFeatureAccessSnapshot } from "@/lib/auth/youtubeFeatureAccessShared";
import type { YoutubeVerificationUiState } from "@/lib/auth/youtubeVerificationTypes";

import type { AnalysisPageData } from "@/lib/analysis/getAnalysisPageData";

export function pickYoutubeAccessFieldsFromPageData(
  data: AnalysisPageData | null
): {
  coreAnalysisFeaturesEnabled: boolean;
  youtubeVerificationUi: YoutubeVerificationUiState;
} {
  if (!data) {
    const snap = deniedYoutubeFeatureAccessSnapshot("페이지 데이터가 없습니다.");
    return {
      coreAnalysisFeaturesEnabled: snap.canUseCoreAnalysisFeatures,
      youtubeVerificationUi: snap.ui,
    };
  }
  return {
    coreAnalysisFeaturesEnabled:
      data.youtubeFeatureAccess.canUseCoreAnalysisFeatures,
    youtubeVerificationUi: data.youtubeFeatureAccess.ui,
  };
}
