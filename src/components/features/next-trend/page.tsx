import { NextTrendPage } from "./NextTrendPage"

export default async function Page({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params
  return <NextTrendPage channelId={channelId} />
}
