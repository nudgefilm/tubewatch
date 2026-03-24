import dynamic from "next/dynamic";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import { buildNextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel";
import {
  type ChannelSearchParams,
  pickChannelIdFromSearchParams,
} from "@/lib/navigation/pickChannelFromSearchParams";
import { AppRouteLoading } from "@/components/layout/AppRouteLoading";

const NextTrendView = dynamic(
  () => import("@/components/next-trend/NextTrendView"),
  { loading: () => <AppRouteLoading variant="next-trend" /> }
);

export default async function NextTrendRoutePage({
  searchParams,
}: {
  searchParams?: ChannelSearchParams;
}) {
  const channelId = pickChannelIdFromSearchParams(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/next-trend", channelId)
  );
  const data = await getAnalysisPageData(channelId);
  const viewModel = buildNextTrendPageViewModel(data);
  return <NextTrendView viewModel={viewModel} />;
}
