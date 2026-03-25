import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { buildChannelDnaSpecViewModel } from "@/lib/channel-dna/buildChannelDnaSpecViewModel";
import { getChannelDnaPageData } from "@/lib/server/channel-dna/getChannelDnaPageData";
import {
  type ChannelSearchParams,
  pickChannelIdFromSearchParams,
} from "@/lib/navigation/pickChannelFromSearchParams";
import { AppRouteLoading } from "@/components/layout/AppRouteLoading";

const ChannelDnaView = dynamic(
  () => import("@/components/channel-dna/ChannelDnaView"),
  { loading: () => <AppRouteLoading variant="channel-dna" /> }
);

export default async function ChannelDnaRoutePage({
  searchParams,
}: {
  searchParams?: ChannelSearchParams;
}) {
  const channelId = pickChannelIdFromSearchParams(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/channel-dna", channelId)
  );
  const data = await getChannelDnaPageData(channelId);
  if (!data) {
    redirect("/channels");
  }
  const spec = buildChannelDnaSpecViewModel(data);
  return <ChannelDnaView data={data} spec={spec} />;
}
