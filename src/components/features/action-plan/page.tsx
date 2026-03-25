import { ActionPlanPage } from "@/components/action-plan"

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  return <ActionPlanPage channelId={channelId} />
}
