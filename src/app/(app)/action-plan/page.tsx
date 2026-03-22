import ActionPlanPage from "@/v0-tubewatchui/app/(app)/action-plan/page";



import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";

import { getAnalysisPageData } from "@/lib/analysis/getAnalysisPageData";

import { buildActionPlanPageViewModel } from "@/lib/action-plan/actionPlanPageViewModel";



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



export default async function ActionPlanRoutePage({

  searchParams,

}: {

  searchParams?: SearchParams;

}) {

  const channelId = pickUserChannelId(searchParams);

  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/action-plan", channelId)
  );

  const data = await getAnalysisPageData(channelId);

  const viewModel = buildActionPlanPageViewModel(data);

  return <ActionPlanPage viewModel={viewModel} />;

}

