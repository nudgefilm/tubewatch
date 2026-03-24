import NextTrendView from "@/components/next-trend/NextTrendView";
import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import { buildNextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel";

type SearchParams = { channel?: string | string[]; channelId?: string | string[] };

function pickUserChannelId(sp: SearchParams | undefined): string | undefined {
  const raw = sp?.channel ?? sp?.channelId;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim() !== "") {
    return raw[0];
  }
  return undefined;
}

export default async function NextTrendRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const channelId = pickUserChannelId(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/next-trend", channelId)
  );
  const data = await getAnalysisPageData(channelId);
  const viewModel = buildNextTrendPageViewModel(data);
  return <NextTrendView viewModel={viewModel} />;
}
