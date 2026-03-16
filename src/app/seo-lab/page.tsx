import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import { getSeoLabPageData } from "@/lib/server/seo-lab/getSeoLabPageData";
import SeoLabView from "@/components/seo-lab/SeoLabView";
import SeoLabEmptyState from "@/components/seo-lab/SeoLabEmptyState";

type SearchParams = { channelId?: string | string[] };

export default async function SeoLabPage({
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
  const data = await getSeoLabPageData(channelId);

  const showEmpty =
    !data ||
    data.channels.length === 0 ||
    data.latestResult === null;

  return (
    <AppShell
      title="SEO 랩"
      description="최근 분석 결과를 바탕으로 제목, 설명, 태그 관점의 개선 포인트를 정리합니다."
    >
      <PageContainer>
        {showEmpty ? (
          <SeoLabEmptyState />
        ) : (
          <SeoLabView data={data} />
        )}
      </PageContainer>
    </AppShell>
  );
}
