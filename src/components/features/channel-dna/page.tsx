import { ChannelDnaPage } from "@/components/channel-dna"

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  console.log("[v0] Channel DNA page route - channelId:", channelId)
  return <ChannelDnaPage channelId={channelId} />
}
