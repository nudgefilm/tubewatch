import type { ReactNode } from "react";
import ChannelSidebar from "@/components/analysis/ChannelSidebar";
import type { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";

type AnalysisShellProps = {
  channels: UserChannelRow[];
  selectedChannelId?: string | null;
  /** 좌측 열: ScoreGauge 등 */
  gauge: ReactNode;
  /** 우측 열: 히어로 요약(제목·카드·버튼) */
  heroRight: ReactNode;
  /** 히어로 아래 전체 폭 본문 */
  children?: ReactNode;
};

/**
 * Channel Analysis: 히어로 2열(채널+게이지 | 요약) + 하단 전체 폭.
 * 자식을 `Children`으로 쪼개지 않고 gauge / heroRight / children으로만 구성한다.
 */
export default function AnalysisShell({
  channels,
  selectedChannelId,
  gauge,
  heroRight,
  children,
}: AnalysisShellProps): JSX.Element {
  return (
    <div className="w-full min-w-0 bg-background">
      <section className="relative border-b bg-gradient-to-b from-muted/30 to-background px-6 py-16 lg:px-12">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <div className="grid w-full min-w-0 grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0">
              <ChannelSidebar
                channels={channels}
                selectedChannelId={selectedChannelId}
                gauge={gauge}
              />
            </div>
            <div className="min-w-0">{heroRight}</div>
          </div>
        </div>
      </section>
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
        {children}
      </div>
    </div>
  );
}
