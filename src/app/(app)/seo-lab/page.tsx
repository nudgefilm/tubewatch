import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getSeoLabPageData } from "@/lib/server/seo-lab/getSeoLabPageData";
import {
  type ChannelSearchParams,
  pickChannelIdFromSearchParams,
} from "@/lib/navigation/pickChannelFromSearchParams";
import { AppRouteLoading } from "@/components/layout/AppRouteLoading";

const SeoLabView = dynamic(
  () => import("@/components/seo-lab/SeoLabView"),
  { loading: () => <AppRouteLoading variant="seo-lab" /> }
);

export default async function SeoLabRoutePage({
  searchParams,
}: {
  searchParams?: ChannelSearchParams;
}) {
  const channelId = pickChannelIdFromSearchParams(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/seo-lab", channelId)
  );
  const data = await getSeoLabPageData(channelId);
  if (!data) {
    redirect("/");
  }
  return <SeoLabView data={data} />;
}
