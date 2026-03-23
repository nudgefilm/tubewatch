import BenchmarkPage from "@/v0-tubewatchui/app/(app)/channel-dna/page";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import { buildBenchmarkPageViewModel } from "@/lib/benchmark/benchmarkPageViewModel";

type SearchParams = { channel?: string | string[] };

function pickUserChannelId(sp: SearchParams | undefined): string | undefined {
  const raw = sp?.channel;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim() !== "") {
    return raw[0];
  }
  return undefined;
}

export default async function ChannelDnaRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const channelId = pickUserChannelId(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/channel-dna", channelId)
  );
  const data = await getAnalysisPageData(channelId);
  const benchmarkViewModel = buildBenchmarkPageViewModel(data);
  return <BenchmarkPage benchmarkViewModel={benchmarkViewModel} />;
}
