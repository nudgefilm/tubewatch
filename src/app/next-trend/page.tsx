import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import AnalysisShell from "@/components/analysis/AnalysisShell";
import NextTrend from "@/components/analysis/NextTrend";
import EmptyState from "@/components/ui/EmptyState";
import {
  getAnalysisPageData,
  type AnalysisPageData,
  type AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";

type SearchParams = { channelId?: string | string[] };

type NextTrendPropsFromResult = {
  recommendedTopics: string[] | null;
  contentPatterns: string[] | null;
  growthActionPlan: string[] | null;
  targetAudience: string[] | null;
};

function extractNextTrendProps(
  latestResult: AnalysisResultRow | null
): NextTrendPropsFromResult | null {
  if (!latestResult) return null;

  const recommendedTopics = (latestResult.recommended_topics ??
    null) as string[] | null;
  const contentPatterns = (latestResult.content_patterns ??
    null) as string[] | null;
  const growthActionPlan = (latestResult.growth_action_plan ??
    null) as string[] | null;
  const targetAudience = (latestResult.target_audience ??
    null) as string[] | null;

  const hasAny =
    (recommendedTopics && recommendedTopics.length > 0) ||
    (contentPatterns && contentPatterns.length > 0) ||
    (growthActionPlan && growthActionPlan.length > 0) ||
    (targetAudience && targetAudience.length > 0);

  if (!hasAny) return null;

  return {
    recommendedTopics,
    contentPatterns,
    growthActionPlan,
    targetAudience,
  };
}

export default async function NextTrendPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?authModal=1&next=/next-trend");
  }

  const channelId =
    typeof searchParams.channelId === "string"
      ? searchParams.channelId
      : Array.isArray(searchParams.channelId)
        ? searchParams.channelId[0]
        : undefined;

  const analysisData: AnalysisPageData | null =
    await getAnalysisPageData(channelId);

  if (!analysisData || analysisData.channels.length === 0) {
    return (
      <AppShell
        title="넥스트 트렌드"
        description="다음 영상 아이디어를 위한 데이터 기반 추천"
      >
        <PageContainer>
          <div className="flex min-h-[50vh] items-center justify-center">
            <EmptyState
              variant="app"
              title="먼저 채널을 등록해 주세요"
              message="TubeWatch는 채널 분석 결과를 바탕으로 넥스트 트렌드를 제안합니다. 채널을 등록한 뒤 분석을 실행해 주세요."
              action={
                <Link
                  href="/channels"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  채널 등록하러 가기
                </Link>
              }
            />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const { channels, selectedChannel, latestResult } = analysisData;
  const props = extractNextTrendProps(latestResult);

  if (!selectedChannel || !props) {
    return (
      <AppShell
        title="넥스트 트렌드"
        description="다음 영상 아이디어를 위한 데이터 기반 추천"
      >
        <AnalysisShell
          channels={channels}
          selectedChannelId={selectedChannel?.id ?? null}
        >
          <div className="flex min-h-[50vh] items-center justify-center">
            <EmptyState
              variant="app"
              title="먼저 채널 분석을 실행해 주세요"
              message="최근 분석 결과가 있어야 넥스트 트렌드 인사이트를 생성할 수 있습니다."
              action={
                <Link
                  href="/analysis"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  채널 분석하기
                </Link>
              }
            />
          </div>
        </AnalysisShell>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="넥스트 트렌드"
      description="채널 데이터를 기반으로 다음 영상 아이디어를 제안합니다."
    >
      <AnalysisShell
        channels={channels}
        selectedChannelId={selectedChannel.id}
      >
        <div className="space-y-4">
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Next Trend
            </p>
            <p className="mt-1 text-sm text-slate-600">
              최근 분석 결과를 바탕으로 추천 주제, 타겟 시청자, 성장 액션을 정리했습니다.
            </p>
          </div>
          <NextTrend
            recommendedTopics={props.recommendedTopics}
            contentPatterns={props.contentPatterns}
            growthActionPlan={props.growthActionPlan}
            targetAudience={props.targetAudience}
          />
        </div>
      </AnalysisShell>
    </AppShell>
  );
}

