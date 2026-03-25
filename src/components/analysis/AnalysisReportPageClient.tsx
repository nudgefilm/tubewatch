/**
 * OPERATIONAL CLIENT ENTRY for /analysis — AnalysisReportView가 AnalysisShell을 내부에서 구성한다.
 */
"use client";

import AnalysisReportView from "@/components/analysis/AnalysisReportView";
import type { AnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel";
import type { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";

type AnalysisReportPageClientProps = {
  viewModel: AnalysisPageViewModel;
  channels: UserChannelRow[];
  selectedChannel: UserChannelRow | null;
};

export default function AnalysisReportPageClient({
  viewModel,
  channels,
  selectedChannel,
}: AnalysisReportPageClientProps): JSX.Element {
  if (!viewModel.hasChannel || !selectedChannel) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm leading-relaxed text-gray-600 shadow-sm">
          {viewModel.limitNotice ?? "연결된 채널이 없습니다. 설정에서 채널을 연결해 주세요."}
        </div>
      </div>
    );
  }

  return (
    <AnalysisReportView
      channels={channels}
      selectedChannel={{
        id: selectedChannel.id,
        channel_title: selectedChannel.channel_title ?? null,
        thumbnail_url: selectedChannel.thumbnail_url ?? null,
        subscriber_count:
          typeof selectedChannel.subscriber_count === "number"
            ? selectedChannel.subscriber_count
            : null,
        created_at: selectedChannel.created_at ?? null,
        last_analysis_requested_at:
          selectedChannel.last_analysis_requested_at ?? null,
        last_analyzed_at: selectedChannel.last_analyzed_at ?? null,
      }}
      reportPresentation={viewModel.reportPresentation}
      reportCompare={viewModel.reportCompare}
      aiInsightFields={viewModel.aiInsightFields}
      analysisHistory={viewModel.analysisHistory}
      analysisViewModel={viewModel.analysisViewModel}
      snapshotMetricsForRadar={viewModel.snapshotMetricsForRadar}
    />
  );
}
