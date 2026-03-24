import { redirect } from "next/navigation";

import ChannelDnaView from "@/components/channel-dna/ChannelDnaView";
import {
  buildProtectedReturnPath,
  redirectToLandingAuthUnlessSignedIn,
} from "@/lib/auth/require-app-user";
import { getBenchmarkPageData } from "@/lib/server/benchmark/getBenchmarkPageData";

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

export default async function ChannelDnaRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const channelId = pickUserChannelId(searchParams);
  await redirectToLandingAuthUnlessSignedIn(
    buildProtectedReturnPath("/channel-dna", channelId)
  );
  const data = await getBenchmarkPageData(channelId);
  if (!data) {
    redirect("/");
  }
  return <ChannelDnaView data={data} />;
}
