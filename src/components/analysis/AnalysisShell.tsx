import { ReactNode } from "react";
import ChannelSidebar from "@/components/analysis/ChannelSidebar";
import { UserChannelRow } from "@/lib/analysis/getAnalysisPageData";

type AnalysisShellProps = {
  channels: UserChannelRow[];
  selectedChannelId?: string | null;
  children: ReactNode;
};

export default function AnalysisShell({
  channels,
  selectedChannelId,
  children,
}: AnalysisShellProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        <ChannelSidebar
          channels={channels}
          selectedChannelId={selectedChannelId}
        />

        <main className="min-w-0 flex-1">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}