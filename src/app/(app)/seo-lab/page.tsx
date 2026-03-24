import { redirect } from "next/navigation";

import SeoLabView from "@/components/seo-lab/SeoLabView";
import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getSeoLabPageData } from "@/lib/server/seo-lab/getSeoLabPageData";

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

export default async function SeoLabRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const channelId = pickUserChannelId(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/seo-lab", channelId)
  );
  const data = await getSeoLabPageData(channelId);
  if (!data) {
    redirect("/");
  }
  return <SeoLabView data={data} />;
}
