import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { getActionPlanPageData } from "@/lib/server/action-plan/getActionPlanPageData";
import ActionPlanEmptyState from "@/components/action-plan/ActionPlanEmptyState";
import ActionPlanV2View from "@/components/action-plan/ActionPlanV2View";

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

  const showEmpty =
    !data ||
    data.channels.length === 0 ||
    data.latestResult === null;

  return (
    <AppShell
      title="액션 플랜"
      description="최근 분석 결과를 바탕으로 바로 실행할 우선순위 액션입니다."
    >
      <PageContainer>
        {showEmpty ? (
          <ActionPlanEmptyState />
        ) : (
          <ActionPlanV2View data={data} />
        )}
      </PageContainer>
    </AppShell>
  );
}
