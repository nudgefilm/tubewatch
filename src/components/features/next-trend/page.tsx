import { NextTrendPage } from "@/components/next-trend"

export default async function Page({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params
  return <NextTrendPage channelId={channelId} />
}
