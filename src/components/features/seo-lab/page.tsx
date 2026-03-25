import { SeoLabPage } from "@/components/seo-lab"

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  return <SeoLabPage channelId={channelId} />
}
