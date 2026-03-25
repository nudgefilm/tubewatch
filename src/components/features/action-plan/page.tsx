import { ActionPlanPage } from "./ActionPlanPage"

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  return <ActionPlanPage channelId={channelId} />
}
