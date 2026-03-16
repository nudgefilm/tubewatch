import { getActionPlanPageData } from "@/lib/server/action-plan/getActionPlanPageData";
import { AppFrameZip } from "@/components/app/AppFrameZip";
import ActionPlanZipView from "@/components/action-plan/ActionPlanZipView";

type SearchParams = { channelId?: string | string[] };

export default async function ActionPlanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const channelId =
    typeof searchParams.channelId === "string"
      ? searchParams.channelId
      : Array.isArray(searchParams.channelId)
        ? searchParams.channelId[0]
        : undefined;
  const data = await getActionPlanPageData(channelId);

  return (
    <AppFrameZip>
      <ActionPlanZipView data={data} />
    </AppFrameZip>
  );
}
