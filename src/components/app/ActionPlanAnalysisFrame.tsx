import type { ReactNode } from "react";
import AppShell from "@/components/app/AppShell";
import AnalysisShell from "@/components/analysis/AnalysisShell";
import type { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";

type ActionPlanAnalysisFrameProps = {
  channels: UserChannelRow[];
  selectedChannelId: string | null;
  children: ReactNode;
};

export function ActionPlanAnalysisFrame({
  channels,
  selectedChannelId,
  children,
}: ActionPlanAnalysisFrameProps): JSX.Element {
  return (
    <AppShell
      title="액션 플랜"
      description="분석 결과를 바탕으로 지금 실행해야 할 우선순위 액션을 확인하세요."
    >
      <AnalysisShell channels={channels} selectedChannelId={selectedChannelId}>
        {children}
      </AnalysisShell>
    </AppShell>
  );
}

