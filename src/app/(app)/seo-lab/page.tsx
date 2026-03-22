import SeoLabPage from "@/v0-tubewatchui/app/(app)/seo-lab/page";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";
import { buildSeoLabPageViewModel } from "@/lib/seo-lab/seoLabPageViewModel";

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

export default async function SeoLabRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const channelId = pickUserChannelId(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/seo-lab", channelId)
  );
  const data = await getAnalysisPageData(channelId);
  const viewModel = buildSeoLabPageViewModel(data);
  return <SeoLabPage viewModel={viewModel} />;
}
