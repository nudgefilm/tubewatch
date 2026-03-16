import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { getBenchmarkPageData } from "@/lib/server/benchmark/getBenchmarkPageData";
import BenchmarkView from "@/components/benchmark/BenchmarkView";
import BenchmarkEmptyState from "@/components/benchmark/BenchmarkEmptyState";

type SearchParams = { channelId?: string | string[] };

export default async function BenchmarkPage({
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
  const data = await getBenchmarkPageData(channelId);

  const showEmpty =
    !data ||
    data.channels.length === 0 ||
    data.latestResult === null;

  return (
    <AppShell
      title="벤치마킹"
      description="최근 분석 결과를 바탕으로 채널의 현재 위치를 핵심 지표 기준으로 비교합니다."
    >
      <PageContainer>
        {showEmpty ? (
          <BenchmarkEmptyState />
        ) : (
          <BenchmarkView data={data} />
        )}
      </PageContainer>
    </AppShell>
  );
}
