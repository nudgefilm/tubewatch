/**
 * OPERATIONAL CLIENT ENTRY for /analysis — 라우트는 이 컴포넌트만 사용 (AnalysisShell + AnalysisReportView).
 * DO NOT swap for @/v0-tubewatchui/app/(app)/analysis/* or v0-core analysis page.
 */
"use client";

import AnalysisShell from "@/components/analysis/AnalysisShell";
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm leading-relaxed text-gray-600 shadow-sm">
        {viewModel.limitNotice ?? "연결된 채널이 없습니다. 설정에서 채널을 연결해 주세요."}
      </div>
    );
  }

  return (
    <AnalysisShell
      channels={channels}
      selectedChannelId={selectedChannel.id}
    >
      <AnalysisReportView
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
    </AnalysisShell>
  );
}
