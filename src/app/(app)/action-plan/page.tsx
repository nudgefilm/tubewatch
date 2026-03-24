import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getActionPlanPageData } from "@/lib/server/action-plan/getActionPlanPageData";
import {
  type ChannelSearchParams,
  pickChannelIdFromSearchParams,
} from "@/lib/navigation/pickChannelFromSearchParams";
import { AppRouteLoading } from "@/components/layout/AppRouteLoading";

const ActionPlanView = dynamic(
  () => import("@/components/action-plan/ActionPlanView"),
  { loading: () => <AppRouteLoading variant="action-plan" /> }
);

export default async function ActionPlanRoutePage({
  searchParams,
}: {
  searchParams?: ChannelSearchParams;
}) {
  const channelId = pickChannelIdFromSearchParams(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/action-plan", channelId)
  );
  const data = await getActionPlanPageData(channelId);
  if (!data) {
    redirect("/");
  }
  return <ActionPlanView data={data} />;
}
