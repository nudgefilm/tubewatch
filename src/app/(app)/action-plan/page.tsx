import { redirect } from "next/navigation";

import ActionPlanView from "@/components/action-plan/ActionPlanView";
import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getActionPlanPageData } from "@/lib/server/action-plan/getActionPlanPageData";

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

export default async function ActionPlanRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const channelId = pickUserChannelId(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/action-plan", channelId)
  );
  const data = await getActionPlanPageData(channelId);
  if (!data) {
    redirect("/");
  }
  return <ActionPlanView data={data} />;
}

